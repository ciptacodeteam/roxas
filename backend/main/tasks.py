"""
Celery Tasks untuk Main App

Tasks untuk async processing:
- Sync Digiflazz products
- Process order top-up
- Send notifications
"""

import logging
from celery import shared_task
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.text import slugify
from decimal import Decimal

from account.tasks import send_email_with_backend_detection
from main.models import (
    Product, ProductItem, Category, Order, OrderStatus,
    DigiflazzTransaction, ApiLog, PriceSync, Payment, PaymentStatus,
)
from main.integrations.digiflazz import (
    get_digiflazz_client, DigiflazzException
)
from main.utils import build_customer_no
from main.input_field_presets import get_preset_for_digiflazz, apply_preset_to_product

logger = logging.getLogger(__name__)

# SKU patterns that identify validation / "cek" items (case-insensitive)
_VALIDATION_SKU_PATTERNS = ("MLCU", "FFCEK", "plncek")


def _is_validation_sku(sku_code: str, product_name: str = "") -> bool:
    """Return True if the SKU or name indicates a validation/check item."""
    low_sku = sku_code.lower()
    low_name = product_name.lower()
    if "cek" in low_name:
        return True
    return any(p.lower() in low_sku for p in _VALIDATION_SKU_PATTERNS)


@shared_task(bind=True, max_retries=3)
def sync_digiflazz_products(self, category_filter=None, brand_filter=None):
    """
    Sync products dari Digiflazz ke database.

    Behaviour
    ---------
    * **New SKU** → create Category (if missing), create Product (if missing),
      create ProductItem with base_price = normal_price = sell_price = Digiflazz price.
    * **Existing SKU** → update ONLY:
        - ``base_price`` (Digiflazz cost price)
        - ``digiflazz_status`` / ``last_synced_at``
        - ``is_active`` — only deactivates; never re-activates a manually-disabled item
      Fields that are **never** touched on update:
        - ``sell_price``, ``normal_price``, ``discounted_price`` (admin-controlled)
        - ``product.category``, ``product.name``, ``product.description`` (admin-controlled)

    Args:
        category_filter: Optional Digiflazz category string to filter the price list.
        brand_filter: Optional Digiflazz brand string to filter the price list.

    Returns:
        dict: {'success', 'created', 'updated', 'errors'}
    """
    price_sync = PriceSync.objects.create(
        sync_type='FULL' if not category_filter and not brand_filter else 'PARTIAL',
        status='RUNNING',
    )

    try:
        client = get_digiflazz_client()

        products = client.get_price_list(
            cmd="prepaid",
            category=category_filter,
            brand=brand_filter,
        )

        if not isinstance(products, list):
            error_msg = "API returned error or invalid response"
            if isinstance(products, dict):
                error_msg = products.get('message', error_msg)
            logger.error(error_msg)
            price_sync.status = 'FAILED'
            price_sync.error_message = error_msg
            price_sync.completed_at = timezone.now()
            price_sync.save(update_fields=['status', 'error_message', 'completed_at', 'updated_at'])
            return {'success': False, 'created': 0, 'updated': 0, 'errors': [error_msg]}

        logger.info(f"Syncing {len(products)} products from Digiflazz...")

        created_count = 0
        updated_count = 0
        errors = []
        now = timezone.now()

        for df_product in products:
            try:
                if not isinstance(df_product, dict):
                    logger.warning(f"Skipping invalid product entry: {df_product}")
                    continue

                buyer_active = bool(df_product.get('buyer_product_status'))
                seller_active = bool(df_product.get('seller_product_status'))
                sku_code = df_product.get('buyer_sku_code', '').strip()

                if not sku_code:
                    continue

                # ── Existing item: update only Digiflazz-owned fields ──────────
                try:
                    product_item = ProductItem.objects.get(sku_code=sku_code)

                    update_fields = ['base_price', 'last_synced_at', 'digiflazz_status', 'updated_at']
                    product_item.base_price = int(df_product['price'])
                    product_item.last_synced_at = now
                    product_item.digiflazz_status = 'ACTIVE' if buyer_active else 'INACTIVE'

                    # Only deactivate — never accidentally re-activate a manually-disabled item
                    if not buyer_active or not seller_active:
                        product_item.is_active = False
                        update_fields.append('is_active')

                    product_item.save(update_fields=update_fields)
                    updated_count += 1
                    logger.debug(f"Updated base_price for existing SKU: {sku_code}")

                # ── New item: create Category, Product, ProductItem ───────────
                except ProductItem.DoesNotExist:
                    # Get or create category — used only when creating new products
                    category_name = df_product.get('category', 'Uncategorized')
                    category, _ = Category.objects.get_or_create(
                        name=category_name,
                        defaults={'slug': slugify(category_name), 'is_active': True},
                    )

                    # Get or create product — never update existing product's category/name
                    product_brand = df_product.get('brand', 'Unknown')
                    product_slug = slugify(product_brand)
                    product, product_created = Product.objects.get_or_create(
                        slug=product_slug,
                        defaults={
                            'name': product_brand,
                            'category': category,
                            'description': f"{product_brand} products",
                            'is_active': True,
                        },
                    )

                    # Auto-assign input field preset for newly created products
                    if product_created:
                        preset_key = get_preset_for_digiflazz(category_name, product_brand)
                        apply_preset_to_product(product, preset_key)
                        product.save(update_fields=['input_fields', 'customer_no_template', 'updated_at'])
                        logger.info(f"Auto-assigned preset '{preset_key}' to new product: {product_brand}")

                    # New items start with sell_price = base_price;
                    # admin should apply a markup via bulk-update-prices afterwards
                    initial_price = int(df_product['price'])
                    item_name = df_product.get('product_name', sku_code)
                    ProductItem.objects.create(
                        sku_code=sku_code,
                        product=product,
                        name=item_name,
                        base_price=initial_price,
                        normal_price=initial_price,
                        sell_price=initial_price,
                        is_active=buyer_active and seller_active,
                        is_validation_item=_is_validation_sku(sku_code, item_name),
                        last_synced_at=now,
                        digiflazz_status='ACTIVE' if buyer_active else 'INACTIVE',
                    )
                    created_count += 1
                    logger.info(f"Created new ProductItem: {sku_code}")

            except Exception as exc:
                sku = df_product.get('buyer_sku_code', 'unknown') if isinstance(df_product, dict) else 'unknown'
                error_msg = f"Error syncing SKU {sku}: {exc}"
                logger.error(error_msg, exc_info=True)
                errors.append(error_msg)

        price_sync.status = 'SUCCESS' if not errors else 'PARTIAL'
        price_sync.items_synced = len(products)
        price_sync.items_created = created_count
        price_sync.items_updated = updated_count
        price_sync.error_message = '\n'.join(errors[:10])  # store first 10 errors
        price_sync.completed_at = now
        price_sync.save(
            update_fields=[
                'status', 'items_synced', 'items_created', 'items_updated',
                'error_message', 'completed_at', 'updated_at',
            ]
        )

        logger.info(
            f"✅ Sync done — Created: {created_count}, Updated: {updated_count}, "
            f"Errors: {len(errors)}"
        )
        return {
            'success': True,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
        }

    except DigiflazzException as exc:
        logger.error(f"Digiflazz API error during sync: {exc}")
        price_sync.status = 'FAILED'
        price_sync.error_message = str(exc)
        price_sync.completed_at = timezone.now()
        price_sync.save(update_fields=['status', 'error_message', 'completed_at', 'updated_at'])
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

    except Exception as exc:
        logger.exception(f"Unexpected error during product sync: {exc}")
        price_sync.status = 'FAILED'
        price_sync.error_message = str(exc)
        price_sync.completed_at = timezone.now()
        price_sync.save(update_fields=['status', 'error_message', 'completed_at', 'updated_at'])
        raise


@shared_task(bind=True, max_retries=5)
def process_order_topup(self, order_id):
    """
    Process order top-up menggunakan Digiflazz
    
    Args:
        order_id: UUID of the order
        
    Returns:
        dict: {
            'success': bool,
            'order_id': str,
            'status': str,
            'message': str
        }
    """
    try:
        order = Order.objects.select_related(
            'product_item__product',
            'payment'
        ).get(id=order_id)
        
        logger.info(f"Processing top-up for Order {order.id}")
        
        # Validasi order
        if order.status != OrderStatus.PROCESSING:
            error_msg = f"Order {order.id} bukan dalam status PROCESSING (current: {order.status})"
            logger.warning(error_msg)
            return {
                'success': False,
                'order_id': str(order.id),
                'status': order.status,
                'message': error_msg
            }
        
        if not order.product_item:
            raise ValueError("Order tidak memiliki product item")
        
        if not order.product_item.sku_code:
            raise ValueError("Product tidak memiliki SKU code")
        
        # Build customer_no from product's template + submitted customer_data
        # The template is configured per-product (e.g. "{userId}{serverId}", "{phoneNumber}")
        customer_data = order.customer_data or {}
        template = order.product_item.product.customer_no_template or ''

        customer_no = build_customer_no(customer_data, template)
        if not customer_no and template:
            raise ValueError("customer_no tidak bisa dibangun dari data yang diberikan")

        logger.info(f"Processing top-up for customer_no: {customer_no!r}")
        
        # Get Digiflazz client
        client = get_digiflazz_client()
        
        # Create transaction
        transaction = client.create_transaction(
            buyer_sku_code=order.product_item.sku_code,
            customer_no=customer_no,
            ref_id=order.order_number,  # Use order_number instead of UUID for ref_id
        )
        
        # Use get_or_create to prevent duplicate DigiflazzTransaction on task retry
        df_transaction, tx_created = DigiflazzTransaction.objects.get_or_create(
            ref_id=order.order_number,
            defaults={
                'order': order,
                'sku_code': transaction.get('buyer_sku_code', ''),
                'customer_no': transaction.get('customer_no', ''),
                'status': transaction.get('status', ''),
                'message': transaction.get('message', ''),
                'serial_number': transaction.get('sn', ''),
                'response_data': transaction,
            }
        )
        if not tx_created:
            # Update existing record with latest response
            df_transaction.status = transaction.get('status', df_transaction.status)
            df_transaction.message = transaction.get('message', df_transaction.message)
            df_transaction.serial_number = transaction.get('sn', df_transaction.serial_number)
            df_transaction.response_data = transaction
            df_transaction.save(update_fields=['status', 'message', 'serial_number', 'response_data', 'updated_at'])

        # Update order based on transaction status
        if client.is_transaction_success(transaction['status'], transaction['rc']):
            order.status = OrderStatus.COMPLETED
            _now = timezone.now()
            order.completed_at = _now
            order.completion_data = {
                'serial_number': transaction.get('sn', ''),
                'completed_at': _now.isoformat(),
                'buyer_last_saldo': transaction.get('buyer_last_saldo'),
                'price': transaction.get('price')
            }
            logger.info(f"✅ Order {order.id} COMPLETED - SN: {transaction.get('sn', '')}")
            
        elif client.is_transaction_pending(transaction['status'], transaction['rc']):
            order.status = OrderStatus.PROCESSING
            logger.info(f"⏳ Order {order.id} PENDING - Will check status later")
            
            # Schedule status check using the new task with appropriate delay
            delay_minutes = client.get_retry_delay_minutes(transaction.get('rc', ''))
            check_digiflazz_transaction_status.apply_async(
                args=[str(df_transaction.id)],
                countdown=delay_minutes * 60
            )
            
        else:
            order.status = OrderStatus.FAILED
            order.failure_reason = transaction['message']
            logger.warning(f"❌ Order {order.id} FAILED - {transaction['message']}")
        
        order.save()

        # Send email notification to user on terminal states
        if order.status in (OrderStatus.COMPLETED, OrderStatus.FAILED):
            send_order_notification.delay(str(order.id), order.status)

        return {
            'success': True,
            'order_id': str(order.id),
            'status': order.status,
            'message': transaction['message'],
            'rc': transaction['rc']
        }
        
    except Order.DoesNotExist:
        error_msg = f"Order {order_id} not found"
        logger.error(error_msg)
        return {
            'success': False,
            'order_id': str(order_id),
            'message': error_msg
        }
        
    except DigiflazzException as e:
        logger.error(f"Digiflazz error for Order {order_id}: {e}")
        
        # Update order status
        try:
            order = Order.objects.get(id=order_id)
            order.failure_reason = str(e)
            order.save()
        except:
            pass
        
        # Retry dengan exponential backoff (max 5 retries)
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 1min, 2min, 4min, 8min, 16min
            logger.info(f"Retrying Order {order_id} in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=e, countdown=countdown)
        else:
            # Max retries reached, mark as failed
            try:
                order = Order.objects.get(id=order_id)
                order.status = 'FAILED'
                order.failure_reason = f"Max retries reached: {str(e)}"
                order.save()
            except:
                pass
            
            return {
                'success': False,
                'order_id': str(order_id),
                'message': f"Max retries reached: {str(e)}"
            }
        
    except Exception as e:
        logger.exception(f"Unexpected error processing Order {order_id}: {e}")
        
        # Update order status
        try:
            order = Order.objects.get(id=order_id)
            order.status = 'FAILED'
            order.failure_reason = str(e)
            order.save()
        except:
            pass
        
        raise


@shared_task
def sync_digiflazz_balance():
    """
    Sync dan log saldo Digiflazz
    
    Task ini bisa dijadwalkan dengan Celery Beat untuk monitoring saldo
    """
    try:
        client = get_digiflazz_client()
        balance = client.get_balance()
        
        deposit = balance.get('deposit', 0)
        
        logger.info(f"Digiflazz Balance: Rp {deposit:,}")
        
        # Log to ApiLog for monitoring
        ApiLog.objects.create(
            provider='DIGIFLAZZ',
            endpoint='/cek-saldo',
            method='POST',
            request_data={'cmd': 'deposit'},
            response_data=balance,
            status='SUCCESS',
            status_code=200,
            response_time=0,
        )

        # Send alert if balance is below threshold
        threshold = getattr(settings, 'DIGIFLAZZ_LOW_BALANCE_THRESHOLD', 100000)
        if deposit < threshold:
            logger.warning(f"⚠️ Low Digiflazz balance: Rp {deposit:,} (threshold: Rp {threshold:,})")
            send_low_balance_alert.delay(deposit)
        
        return {
            'success': True,
            'deposit': deposit
        }
        
    except DigiflazzException as e:
        logger.error(f"Failed to get Digiflazz balance: {e}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def cleanup_old_api_logs(days=30):
    """
    Cleanup API logs yang lebih lama dari X hari
    
    Args:
        days: Jumlah hari untuk keep logs (default 30)
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    
    deleted_count = ApiLog.objects.filter(
        created_at__lt=cutoff_date
    ).delete()[0]
    
    logger.info(f"Deleted {deleted_count} API logs older than {days} days")
    
    return {
        'success': True,
        'deleted_count': deleted_count
    }


@shared_task(bind=True, max_retries=5)
def check_digiflazz_transaction_status(self, transaction_id):
    """
    Check status transaksi Digiflazz secara async
    
    Task ini akan:
    1. Cek status transaksi via API Digiflazz
    2. Update status di database
    3. Schedule retry jika masih pending
    4. Stop jika sudah final (success/failed) atau expired
    
    Args:
        transaction_id: ID DigiflazzTransaction
        
    Returns:
        dict: Status check result
    """
    try:
        from main.models import DigiflazzTransaction, OrderStatus
        from main.integrations.digiflazz import get_digiflazz_client
        
        # Get transaction
        try:
            df_transaction = DigiflazzTransaction.objects.get(id=transaction_id)
            order = df_transaction.order
        except DigiflazzTransaction.DoesNotExist:
            logger.error(f"DigiflazzTransaction {transaction_id} not found")
            return {'success': False, 'error': 'Transaction not found'}
        
        client = get_digiflazz_client()
        
        # Check if transaction is expired (>90 days)
        if client.is_transaction_expired(df_transaction.created_at):
            logger.warning(f"Transaction {transaction_id} is expired (>90 days), stopping status checks")
            
            # Mark as expired if still pending
            if order.status in [OrderStatus.PENDING, OrderStatus.PROCESSING]:
                order.status = OrderStatus.EXPIRED
                order.failure_reason = "Transaction expired after 90 days"
                order.save()
                
                df_transaction.status = "Expired"
                df_transaction.message = "Transaction expired after 90 days"
                df_transaction.save()
            
            return {'success': True, 'status': 'expired'}
        
        logger.info(f"Checking status for transaction {df_transaction.ref_id}")
        
        # Check status via API (using same ref_id as original topup)
        try:
            status_response = client.check_transaction_status(
                buyer_sku_code=df_transaction.sku_code,
                customer_no=df_transaction.customer_no,
                ref_id=df_transaction.ref_id
            )
            
            logger.info(
                f"Status check result for {df_transaction.ref_id}: "
                f"Status={status_response.get('status')}, RC={status_response.get('rc')}"
            )
            
        except Exception as e:
            logger.warning(f"Status check failed for {df_transaction.ref_id}: {e}")
            
            # Retry with exponential backoff
            retry_count = self.request.retries
            if retry_count < self.max_retries:
                countdown = 60 * (2 ** retry_count)  # 1min, 2min, 4min, 8min, 16min
                logger.info(f"Retrying status check in {countdown/60} minutes (retry {retry_count + 1}/{self.max_retries})")
                raise self.retry(countdown=countdown)
            else:
                logger.error(f"Max retries reached for status check of {df_transaction.ref_id}")
                return {'success': False, 'error': 'Max retries reached'}
        
        # Update transaction data
        df_transaction.status = status_response.get('status', df_transaction.status)
        df_transaction.message = status_response.get('message', df_transaction.message)
        df_transaction.serial_number = status_response.get('sn', df_transaction.serial_number)
        df_transaction.response_data = status_response
        df_transaction.save()
        
        # Update order status based on result
        if client.is_transaction_success(status_response.get('status', ''), status_response.get('rc', '')):
            # Transaction completed successfully
            order.status = OrderStatus.COMPLETED
            _now = timezone.now()
            order.completed_at = _now
            order.completion_data = {
                'serial_number': status_response.get('sn', ''),
                'completed_at': _now.isoformat(),
                'buyer_last_saldo': status_response.get('buyer_last_saldo'),
                'price': status_response.get('price')
            }
            order.save()
            send_order_notification.delay(str(order.id), 'COMPLETED')
            logger.info(f"✅ Order {order.id} COMPLETED via status check - SN: {status_response.get('sn')}")
            return {'success': True, 'status': 'completed'}
            
        elif client.is_transaction_failed(status_response.get('status', ''), status_response.get('rc', '')):
            # Transaction failed
            order.status = OrderStatus.FAILED
            order.failure_reason = status_response.get('message', 'Transaction failed')
            order.save()
            send_order_notification.delay(str(order.id), 'FAILED')
            logger.warning(f"❌ Order {order.id} FAILED via status check - {order.failure_reason}")
            return {'success': True, 'status': 'failed'}
            
        elif client.needs_status_check(status_response.get('status', ''), status_response.get('rc', '')):
            # Still needs checking - schedule next check
            delay_minutes = client.get_retry_delay_minutes(status_response.get('rc', ''))
            
            # Cap maximum delay at 30 minutes
            delay_minutes = min(delay_minutes, 30)
            
            logger.info(f"🔄 Scheduling next status check for Order {order.id} in {delay_minutes} minutes")
            check_digiflazz_transaction_status.apply_async(
                args=[transaction_id],
                countdown=delay_minutes * 60
            )
            
            return {'success': True, 'status': 'pending', 'next_check_minutes': delay_minutes}
        
        else:
            # Unknown status - log and don't retry
            logger.warning(
                f"Unknown status for transaction {df_transaction.ref_id}: "
                f"Status={status_response.get('status')}, RC={status_response.get('rc')}"
            )
            return {'success': True, 'status': 'unknown'}
        
    except Exception as e:
        logger.exception(f"Error checking Digiflazz transaction status: {e}")
        
        # Retry with exponential backoff for unexpected errors
        retry_count = self.request.retries
        if retry_count < self.max_retries:
            countdown = 300 * (2 ** retry_count)  # 5min, 10min, 20min, 40min, 80min
            logger.info(f"Retrying status check in {countdown/60} minutes due to error")
            raise self.retry(countdown=countdown, exc=e)
        
        return {'success': False, 'error': str(e)}


# ======================================================================
# EMAIL NOTIFICATION TASKS
# ======================================================================

@shared_task(bind=True, max_retries=3)
def send_order_notification(self, order_id, notification_type):
    """
    Send order status email notification to customer.

    Args:
        order_id: UUID string of the Order
        notification_type: 'COMPLETED' | 'FAILED' | 'PROCESSING' | 'REFUNDED'
    """
    TEMPLATES = {
        'COMPLETED':  'main/emails/order_completed_email.html',
        'FAILED':     'main/emails/order_failed_email.html',
        'PROCESSING': 'main/emails/order_processing_email.html',
        'REFUNDED':   'main/emails/order_refunded_email.html',
    }
    SUBJECTS = {
        'COMPLETED':  '✅ Top-up Berhasil - {order_number}',
        'FAILED':     '❌ Top-up Gagal - {order_number}',
        'PROCESSING': '⏳ Pembayaran Diterima - {order_number}',
        'REFUNDED':   '💰 Refund Diproses - {order_number}',
    }
    try:
        order = Order.objects.select_related(
            'user', 'product_item__product', 'payment_method'
        ).get(id=order_id)

        template = TEMPLATES.get(notification_type)
        subject_tpl = SUBJECTS.get(notification_type)

        if not template:
            logger.error(f"Unknown notification_type: {notification_type}")
            return f"Unknown notification_type: {notification_type}"

        subject = subject_tpl.format(order_number=order.order_number)
        html_message = render_to_string(template, {
            'order': order,
            'FRONTEND_URL': getattr(settings, 'FRONTEND_URL', ''),
        })
        plain_message = strip_tags(html_message)

        return send_email_with_backend_detection(
            subject=subject,
            plain_message=plain_message,
            html_message=html_message,
            recipient_list=[order.user.email],
            email_type=f"order_{notification_type.lower()}_notification",
        )

    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for notification")
        return f"Order {order_id} not found"

    except Exception as exc:
        logger.error(f"Error sending order notification: {exc}", exc_info=True)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        raise


@shared_task(bind=True, max_retries=3)
def process_midtrans_refund(self, order_id, refund_amount=None, reason=''):
    """
    Call Midtrans refund API and update payment/order status.

    Args:
        order_id: UUID string of the Order
        refund_amount: Optional override; falls back to order.refund_amount or total_amount
        reason: Human-readable refund reason
    """
    from main.integrations.midtrans import get_midtrans_client, MidtransException

    try:
        order = Order.objects.select_related('payment').get(id=order_id)
        payment = getattr(order, 'payment', None)

        if not payment or not payment.transaction_id:
            raise ValueError(f"Order {order_id} has no linked Midtrans transaction")

        client = get_midtrans_client()
        amount = refund_amount or getattr(order, 'refund_amount', None) or order.total_amount

        result = client.refund_transaction(
            order_id=payment.transaction_id,
            reason=reason or getattr(order, 'refund_reason', '') or 'Admin refund',
            amount=amount,
        )

        payment.status = PaymentStatus.REFUND
        payment.save(update_fields=['status', 'updated_at'])

        logger.info(f"✅ Midtrans refund processed for Order {order_id}: {result}")
        send_order_notification.delay(str(order_id), 'REFUNDED')

        return {'success': True, 'order_id': str(order_id), 'result': result}

    except Exception as exc:
        logger.error(f"Error processing refund for Order {order_id}: {exc}", exc_info=True)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=120 * (2 ** self.request.retries))
        raise


@shared_task
def send_low_balance_alert(deposit):
    """
    Send low Digiflazz balance alert email to the configured ADMIN_ALERT_EMAIL.

    Args:
        deposit: Current balance (int, IDR)
    """
    admin_email = getattr(settings, 'ADMIN_ALERT_EMAIL', '')
    if not admin_email:
        logger.warning("ADMIN_ALERT_EMAIL not set — cannot send low balance alert")
        return "ADMIN_ALERT_EMAIL not configured"

    threshold = getattr(settings, 'DIGIFLAZZ_LOW_BALANCE_THRESHOLD', 100000)
    html_message = render_to_string('main/emails/low_balance_alert_email.html', {
        'deposit': deposit,
        'threshold': threshold,
    })
    plain_message = strip_tags(html_message)

    return send_email_with_backend_detection(
        subject=f'⚠️ Saldo Digiflazz Rendah: Rp {deposit:,}',
        plain_message=plain_message,
        html_message=html_message,
        recipient_list=[admin_email],
        email_type='low_balance_alert',
    )
