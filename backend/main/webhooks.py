"""
Webhook Views for Payment Gateways

Endpoints untuk menerima webhook dari:
- Digiflazz (game top-up)
- Midtrans (payment gateway)
"""

import json
import logging
import os
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.utils import timezone

from main.integrations.digiflazz import DigiflazzClient, get_digiflazz_client
from main.integrations.midtrans import MidtransClient, get_midtrans_client
from main.models import DigiflazzTransaction, Order, OrderStatus, Payment, PaymentStatus

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def digiflazz_webhook(request):
    """
    Handle webhook dari Digiflazz
    
    URL Configuration (urls.py):
        path('webhooks/digiflazz/', digiflazz_webhook, name='digiflazz_webhook'),
    
    Webhook Settings di Digiflazz:
        URL: https://yourdomain.com/api/v1/webhooks/digiflazz/
        Secret: Set di environment variable DIGIFLAZZ_WEBHOOK_SECRET
    
    Headers yang diterima:
        X-Digiflazz-Event: create atau update
        X-Hub-Signature: sha1=xxxxx (HMAC signature)
        User-Agent: Digiflazz-Hookshot (prepaid) atau Digiflazz-Pasca-Hookshot (postpaid)
    """
    try:
        # Get webhook secret
        webhook_secret = os.environ.get('DIGIFLAZZ_WEBHOOK_SECRET', '')
        
        if not webhook_secret:
            logger.warning("DIGIFLAZZ_WEBHOOK_SECRET not set - webhook validation disabled!")
        
        # Get raw payload
        payload = request.body.decode('utf-8')
        
        # Validate signature (jika secret diatur)
        if webhook_secret:
            signature = request.META.get('HTTP_X_HUB_SIGNATURE', '')
            
            if not DigiflazzClient.validate_webhook_signature(payload, signature, webhook_secret):
                logger.error(f"Invalid webhook signature from IP: {get_client_ip(request)}")
                return JsonResponse(
                    {'error': 'Invalid signature'},
                    status=403
                )
        
        # Parse payload
        try:
            payload_data = json.loads(payload)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            return JsonResponse(
                {'error': 'Invalid JSON'},
                status=400
            )
        
        # Parse event
        headers = {
            'X-Digiflazz-Event': request.META.get('HTTP_X_DIGIFLAZZ_EVENT', ''),
            'User-Agent': request.META.get('HTTP_USER_AGENT', '')
        }
        
        event = DigiflazzClient.parse_webhook_event(headers, payload_data)
        
        logger.info(
            f"Digiflazz Webhook - Event: {event['event_type']}, "
            f"Type: {event['transaction_type']}, "
            f"Ref ID: {event['data'].get('ref_id')}"
        )
        
        # Process based on transaction type
        if event['transaction_type'] == 'prepaid':
            result = handle_prepaid_webhook(event)
        elif event['transaction_type'] == 'postpaid':
            result = handle_postpaid_webhook(event)
        else:
            logger.warning(f"Unknown transaction type: {event['transaction_type']}")
            return JsonResponse(
                {'error': 'Unknown transaction type'},
                status=400
            )
        
        return JsonResponse({
            'status': 'ok',
            'message': result
        })
        
    except Exception as e:
        logger.exception(f"Error processing Digiflazz webhook: {e}")
        return JsonResponse(
            {'error': 'Internal server error'},
            status=500
        )


def handle_prepaid_webhook(event):
    """
    Handle webhook untuk transaksi prepaid (game top-up)
    
    Args:
        event: Parsed event dari DigiflazzClient.parse_webhook_event()
        
    Returns:
        Result message
    """
    data = event['data']
    ref_id = data.get('ref_id')
    event_type = event['event_type']
    
    # Skip validation transactions (CHECK-*, MLCHECK-*, etc.)
    # These are temporary account validation requests, not actual orders
    if ref_id and (ref_id.startswith('CHECK-') or ref_id.startswith('MLCHECK-')):
        logger.info(f"Skipping webhook for validation transaction: {ref_id}")
        return f"Validation transaction ignored: {ref_id}"
    
    try:
        # Find transaction by ref_id
        df_transaction = DigiflazzTransaction.objects.get(ref_id=ref_id)
        order = df_transaction.order
        
        logger.info(
            f"Processing webhook for Order {order.id} - "
            f"Event: {event_type}, Status: {data['status']}, RC: {data['rc']}"
        )
        
        # Update transaction data
        df_transaction.status = data['status']
        df_transaction.message = data['message']
        df_transaction.serial_number = data.get('sn', '')
        # Store the raw response data including RC
        if not df_transaction.response_data:
            df_transaction.response_data = {}
        df_transaction.response_data.update(data)
        df_transaction.save()
        
        # Update order based on status
        client = get_digiflazz_client()
        
        if client.is_transaction_success(data['status'], data['rc']):
            # Transaction SUCCESS
            order.status = OrderStatus.COMPLETED
            order.completion_data = {
                'serial_number': data.get('sn', ''),
                'completed_at': timezone.now().isoformat(),
                'buyer_last_saldo': data.get('buyer_last_saldo'),
                'price': data.get('price')
            }
            
            logger.info(f"✅ Order {order.id} COMPLETED - SN: {data.get('sn')}")
            
        elif client.is_transaction_pending(data['status'], data['rc']):
            # Transaction PENDING or needs status check
            if order.status != OrderStatus.PROCESSING:
                order.status = OrderStatus.PROCESSING
            
            logger.info(f"⏳ Order {order.id} still PENDING - {data['message']} (RC: {data['rc']})")
            
            # Schedule status check if needed
            if client.needs_status_check(data['status'], data['rc']):
                # Don't schedule if transaction is expired (>90 days)
                if not client.is_transaction_expired(df_transaction.created_at):
                    from main.tasks import check_digiflazz_transaction_status
                    delay_minutes = client.get_retry_delay_minutes(data['rc'])
                    
                    logger.info(f"📅 Scheduling status check for Order {order.id} in {delay_minutes} minutes")
                    check_digiflazz_transaction_status.apply_async(
                        args=[str(df_transaction.id)],
                        countdown=delay_minutes * 60
                    )
                else:
                    logger.warning(f"⚠️ Order {order.id} is expired (>90 days), not scheduling status check")
            
        elif client.is_transaction_failed(data['status'], data['rc']):
            # Transaction FAILED
            order.status = OrderStatus.FAILED
            order.failure_reason = data['message']
            
            logger.warning(f"❌ Order {order.id} FAILED - {data['message']} (RC: {data['rc']})")
            
            # TODO: Refund payment jika sudah dibayar
            # if order.payment and order.payment.status == 'success':
            #     create_refund(order)
        
        order.save()
        
        # TODO: Send notification to user (email, push notification, etc.)
        # send_order_status_notification(order)
        
        return f"Order {order.id} updated to {order.status}"
        
    except DigiflazzTransaction.DoesNotExist:
        logger.error(f"Transaction not found for ref_id: {ref_id}")
        return f"Transaction not found: {ref_id}"
        
    except Exception as e:
        logger.exception(f"Error handling prepaid webhook: {e}")
        raise


def handle_postpaid_webhook(event):
    """
    Handle webhook untuk transaksi postpaid
    
    Note: Untuk game store, biasanya hanya menggunakan prepaid.
    Fungsi ini disediakan untuk kelengkapan.
    
    Args:
        event: Parsed event dari DigiflazzClient.parse_webhook_event()
        
    Returns:
        Result message
    """
    data = event['data']
    ref_id = data.get('ref_id')
    
    logger.info(f"Postpaid webhook received for ref_id: {ref_id}")
    
    # Similar logic seperti prepaid, tapi dengan field berbeda
    # Postpaid biasanya untuk tagihan PLN, PDAM, dll (bukan untuk game)
    
    return f"Postpaid transaction processed: {ref_id}"


def get_client_ip(request):
    """
    Get client IP address dari request
    
    Args:
        request: Django request object
        
    Returns:
        IP address string
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


# Optional: Webhook untuk ping test
@csrf_exempt
def digiflazz_webhook_ping(request):
    """
    Endpoint untuk test webhook dari Digiflazz
    
    URL Configuration:
        path('webhooks/digiflazz/ping/', digiflazz_webhook_ping, name='digiflazz_webhook_ping'),
    
    Test dengan:
        curl -X POST https://yourdomain.com/api/v1/webhooks/digiflazz/ping/
    """
    logger.info(f"Webhook ping received from IP: {get_client_ip(request)}")
    
    return JsonResponse({
        'status': 'ok',
        'message': 'Webhook endpoint is working',
        'timestamp': timezone.now().isoformat()
    })


# ==================== MIDTRANS WEBHOOK ====================

@csrf_exempt
@require_POST
def midtrans_webhook(request):
    """
    Handle notification webhook dari Midtrans
    
    URL Configuration (urls.py):
        path('webhooks/midtrans/', midtrans_webhook, name='midtrans_webhook'),
    
    Webhook Settings di Midtrans Dashboard:
        Payment Notification URL: https://yourdomain.com/api/v1/webhooks/midtrans/
        
    Notification Fields:
        - transaction_status: settlement, pending, deny, cancel, expire
        - fraud_status: accept, deny, challenge
        - order_id: Your order ID
        - signature_key: SHA512 hash untuk validasi
    """
    try:
        # Parse notification JSON
        try:
            notification = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            return JsonResponse(
                {'error': 'Invalid JSON'},
                status=400
            )
        
        # Extract important fields
        order_id = notification.get('order_id')
        transaction_status = notification.get('transaction_status')
        fraud_status = notification.get('fraud_status')
        
        logger.info(
            f"Midtrans Notification - Order: {order_id}, "
            f"Status: {transaction_status}, Fraud: {fraud_status}"
        )
        
        # Validate signature
        client = get_midtrans_client()
        
        if not client.validate_notification(notification):
            logger.error(f"Invalid signature for Order: {order_id}")
            return JsonResponse(
                {'error': 'Invalid signature'},
                status=403
            )
        
        # Process notification
        result = handle_midtrans_notification(notification)
        
        return JsonResponse({
            'status': 'ok',
            'message': result
        })
        
    except Exception as e:
        logger.exception(f"Error processing Midtrans notification: {e}")
        return JsonResponse(
            {'error': 'Internal server error'},
            status=500
        )


def handle_midtrans_notification(notification: dict) -> str:
    """
    Handle Midtrans payment notification
    
    Implements idempotency and proper status transition handling as per Midtrans best practices:
    - Prevents duplicate/out-of-order notifications from causing issues
    - Only allows valid status transitions (e.g., can't go from PROCESSING back to PENDING)
    
    Args:
        notification: Notification data dari Midtrans
        
    Returns:
        Result message
    """
    order_id = notification.get('order_id')
    transaction_status = notification.get('transaction_status')
    fraud_status = notification.get('fraud_status')
    transaction_id = notification.get('transaction_id')
    payment_type = notification.get('payment_type')
    gross_amount = notification.get('gross_amount')
    
    try:
        # Find order by order_number (not UUID id)
        order = Order.objects.get(order_number=order_id)
        
        logger.info(f"Processing payment notification for Order {order_id}")
        
        # Find or create payment record
        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                'payment_method': order.payment_method,
                'amount': int(float(gross_amount)),
                'status': 'pending',
                'transaction_id': transaction_id,
                'external_id': order_id,
            }
        )
        
        # Update payment data (always update these fields)
        payment.transaction_id = transaction_id
        payment.raw_response = notification
        
        # Get Midtrans client
        client = get_midtrans_client()
        
        # Define status priority to prevent downgrade (higher = more final)
        STATUS_PRIORITY = {
            OrderStatus.PENDING: 1,
            OrderStatus.PAID: 2,
            OrderStatus.PROCESSING: 3,
            OrderStatus.COMPLETED: 5,
            OrderStatus.FAILED: 2,
            OrderStatus.REFUNDED: 2,
            OrderStatus.EXPIRED: 2,
        }
        
        # Determine new status based on transaction
        new_order_status = None
        new_payment_status = None
        
        if client.is_transaction_success(notification):
            # Payment SUCCESS
            new_payment_status = PaymentStatus.SETTLEMENT
            new_order_status = OrderStatus.PROCESSING
            
            # Set paid_at only if not already set (idempotency)
            if not payment.paid_at:
                payment.paid_at = timezone.now()
            
            logger.info(f"✅ Payment SUCCESS for Order {order_id}")
            
        elif client.is_transaction_pending(notification):
            # Payment PENDING
            new_payment_status = PaymentStatus.PENDING
            new_order_status = OrderStatus.PENDING
            
            logger.info(f"⏳ Payment PENDING for Order {order_id}")
            
        elif client.is_transaction_failed(notification):
            # Payment FAILED
            new_payment_status = PaymentStatus.DENY
            new_order_status = OrderStatus.FAILED
            
            failure_reason = client.get_transaction_status_message(notification)
            payment.failure_reason = failure_reason
            order.failure_reason = failure_reason
            
            logger.warning(f"❌ Payment FAILED for Order {order_id} - {failure_reason}")
        
        # Apply status updates only if it's a valid transition (prevents out-of-order updates)
        current_priority = STATUS_PRIORITY.get(order.status, 0)
        new_priority = STATUS_PRIORITY.get(new_order_status, 0)
        
        if new_priority >= current_priority:
            # Valid transition - apply updates
            if new_payment_status:
                payment.status = new_payment_status
            if new_order_status:
                order.status = new_order_status
            
            payment.save()
            order.save()
            
            logger.info(f"Status updated: Order {order_id} → {order.status}, Payment → {payment.status}")
            
            # Trigger top-up process only on first success transition to PROCESSING
            if new_order_status == OrderStatus.PROCESSING and current_priority < new_priority:
                from main.tasks import process_order_topup
                logger.info(f"Triggering Digiflazz top-up process for Order {order_id}")
                process_order_topup.delay(str(order.id))
        else:
            # Invalid transition - ignore this notification (out of order)
            logger.warning(
                f"Ignoring out-of-order notification for Order {order_id}: "
                f"Current status={order.status} (priority={current_priority}), "
                f"New status={new_order_status} (priority={new_priority})"
            )
            payment.save()  # Still save payment to update transaction_id and raw_response
        
        # TODO: Send notification to user
        # send_payment_status_notification(order, payment)
        
        return f"Order {order_id} status: {order.status}"
        
    except Order.DoesNotExist:
        logger.error(f"Order not found: {order_id}")
        return f"Order not found: {order_id}"
        
    except Exception as e:
        logger.exception(f"Error handling Midtrans notification: {e}")
        raise


@csrf_exempt
def midtrans_webhook_ping(request):
    """
    Endpoint untuk test webhook dari Midtrans
    
    URL Configuration:
        path('webhooks/midtrans/ping/', midtrans_webhook_ping, name='midtrans_webhook_ping'),
    """
    logger.info(f"Midtrans webhook ping from IP: {get_client_ip(request)}")
    
    return JsonResponse({
        'status': 'ok',
        'message': 'Midtrans webhook endpoint is working',
        'timestamp': timezone.now().isoformat()
    })
