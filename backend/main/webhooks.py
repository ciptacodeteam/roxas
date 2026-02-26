"""
Webhook Views for Payment Gateways

Endpoints untuk menerima webhook dari:
- Digiflazz (game top-up)
- Midtrans (payment gateway)
"""

import ipaddress
import json
import logging
from django.conf import settings as django_settings
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
        # IP allowlist check
        client_ip = get_client_ip(request)
        allowed_ips = _get_webhook_ip_allowlist('DIGIFLAZZ_WEBHOOK_ALLOWED_IPS')
        if allowed_ips and not _is_ip_allowed(client_ip, allowed_ips):
            logger.warning(f"Digiflazz webhook rejected — IP not in allowlist: {client_ip}")
            return JsonResponse({'error': 'Forbidden'}, status=403)
        logger.info(f"Digiflazz webhook received from IP: {client_ip}")

        # Get webhook secret
        webhook_secret = getattr(django_settings, 'DIGIFLAZZ_WEBHOOK_SECRET', '')
        
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
    
    # Handle validation transactions (CHECK-*, MLCHECK-*, etc.)
    # These are account validation requests, not actual orders
    if ref_id and (ref_id.startswith('CHECK-') or ref_id.startswith('MLCHECK-')):
        return handle_validation_webhook(data, ref_id)
    
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
            now = timezone.now()
            order.completed_at = now
            order.completion_data = {
                'serial_number': data.get('sn', ''),
                'completed_at': now.isoformat(),
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

        # Fire email notification on terminal states
        if order.status in (OrderStatus.COMPLETED, OrderStatus.FAILED):
            from main.tasks import send_order_notification
            send_order_notification.delay(str(order.id), order.status)

        return f"Order {order.id} updated to {order.status}"
        
    except DigiflazzTransaction.DoesNotExist:
        logger.error(f"Transaction not found for ref_id: {ref_id}")
        return f"Transaction not found: {ref_id}"
        
    except Exception as e:
        logger.exception(f"Error handling prepaid webhook: {e}")
        raise


def handle_validation_webhook(data, ref_id):
    """
    Handle webhook untuk validation transactions (CHECK-*, MLCHECK-*)
    
    Args:
        data: Webhook data dari Digiflazz
        ref_id: Reference ID (CHECK-* atau MLCHECK-*)
        
    Returns:
        Result message
    """
    from main.models import DigiflazzAccountCheck
    
    try:
        account_check = DigiflazzAccountCheck.objects.get(ref_id=ref_id)
        
        logger.info(
            f"Processing validation webhook for {ref_id} - "
            f"Status: {data['status']}, RC: {data['rc']}"
        )
        
        # Update account check with webhook data
        account_check.status = data['status']
        account_check.message = data['message']
        account_check.rc = data.get('rc', '')
        account_check.webhook_data = data
        
        # Extract account name from webhook
        account_name = data.get('sn', '') or data.get('customer_name', '')
        
        # If account_name is empty, try to extract from message
        # Format: "User ID 29180822 Zone 2043 / Username ♡+"
        if not account_name and data.get('message') and 'Username' in data['message']:
            try:
                # Extract text after "Username "
                username_part = data['message'].split('Username')[-1].strip()
                # Get text until first space (or end of string)
                extracted_name = username_part.split()[0] if username_part else ''
                if extracted_name:
                    account_name = extracted_name
                    logger.info(f"Extracted username from webhook message: {account_name}")
            except Exception as e:
                logger.warning(f"Failed to extract username from webhook message: {e}")
        
        if account_name:
            account_check.account_name = account_name
        
        # Update validation status
        client = get_digiflazz_client()
        if client.is_transaction_success(data['status'], data['rc']):
            account_check.is_valid = True
            logger.info(f"✓ Validation {ref_id} CONFIRMED - Account: {account_name}")
        elif client.is_transaction_failed(data['status'], data['rc']):
            account_check.is_valid = False
            logger.info(f"✗ Validation {ref_id} FAILED - {data['message']}")
        # For PENDING, keep current is_valid value
        
        account_check.save()
        
        return f"Validation check {ref_id} updated: {data['status']}"
        
    except DigiflazzAccountCheck.DoesNotExist:
        logger.warning(
            f"Account check not found for ref_id: {ref_id}. "
            f"Webhook data: Status={data['status']}, Message={data['message']}"
        )
        return f"Account check not found: {ref_id}"
        
    except Exception as e:
        logger.exception(f"Error handling validation webhook: {e}")
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


# ==================== IP ALLOWLIST HELPERS ====================

def _is_ip_allowed(ip: str, allowed_cidrs: list) -> bool:
    """
    Return True if ip falls within any CIDR in allowed_cidrs.
    An empty list means no restriction (allow all).
    """
    if not allowed_cidrs:
        return True
    try:
        client_addr = ipaddress.ip_address(ip)
        for cidr in allowed_cidrs:
            try:
                if client_addr in ipaddress.ip_network(cidr.strip(), strict=False):
                    return True
            except ValueError:
                logger.warning(f"Invalid CIDR in webhook allowlist: {cidr}")
    except ValueError:
        logger.warning(f"Invalid client IP for allowlist check: {ip}")
    return False


def _get_webhook_ip_allowlist(settings_key: str, default_cidrs=None) -> list:
    """
    Return parsed IP/CIDR allowlist from Django settings.
    Falls back to default_cidrs if the setting is empty.
    """
    raw = getattr(django_settings, settings_key, '')
    if raw:
        return [item.strip() for item in raw.split(',') if item.strip()]
    return default_cidrs or []


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
        # IP allowlist check (Midtrans known production IPs used as default in prod)
        _MIDTRANS_DEFAULT_IPS = ['103.208.23.0/24', '103.179.188.0/28']
        client_ip = get_client_ip(request)
        is_production = getattr(django_settings, 'MIDTRANS_PRODUCTION', False)
        allowed_ips = _get_webhook_ip_allowlist(
            'MIDTRANS_WEBHOOK_ALLOWED_IPS',
            default_cidrs=_MIDTRANS_DEFAULT_IPS if is_production else [],
        )
        if allowed_ips and not _is_ip_allowed(client_ip, allowed_ips):
            logger.warning(f"Midtrans webhook rejected — IP not in allowlist: {client_ip}")
            return JsonResponse({'error': 'Forbidden'}, status=403)
        logger.info(f"Midtrans webhook received from IP: {client_ip}")

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
        payment.webhook_data = notification
        
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
                _now = timezone.now()
                payment.paid_at = _now
                order.paid_at = _now
            
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
            payment.save()  # Still save payment to update transaction_id and webhook_data
        
        # Send PROCESSING notification when payment is confirmed
        if new_order_status == OrderStatus.PROCESSING and new_priority >= current_priority:
            from main.tasks import send_order_notification
            send_order_notification.delay(str(order.id), 'PROCESSING')

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
    Endpoint untuk test webhook dari Midtrans.
    GET returns config (no secrets) so you can verify production vs sandbox.
    """
    from django.conf import settings
    logger.info(f"Midtrans webhook ping from IP: {get_client_ip(request)}")

    # Expose mode and API URL so production can verify env (no secrets)
    is_production = getattr(settings, 'MIDTRANS_PRODUCTION', False)
    api_url = "https://api.midtrans.com/v2" if is_production else "https://api.sandbox.midtrans.com/v2"
    server_key_set = bool(getattr(settings, 'MIDTRANS_SERVER_KEY', ''))

    return JsonResponse({
        'status': 'ok',
        'message': 'Midtrans webhook endpoint is working',
        'timestamp': timezone.now().isoformat(),
        'midtrans_mode': 'production' if is_production else 'sandbox',
        'midtrans_api_url': api_url,
        'server_key_configured': server_key_set,
    })
