"""
Celery Tasks untuk Main App

Tasks untuk async processing:
- Sync Digiflazz products
- Process order top-up
- Send notifications
"""

import logging
from celery import shared_task
from django.utils import timezone
from django.utils.text import slugify
from decimal import Decimal

from main.models import (
    Product, ProductItem, Category, Order, OrderStatus,
    DigiflazzTransaction, ApiLog
)
from main.integrations.digiflazz import (
    get_digiflazz_client, DigiflazzException
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def sync_digiflazz_products(self, category_filter=None, brand_filter=None):
    """
    Sync products dari Digiflazz ke database
    
    Args:
        category_filter: Filter by kategori (optional)
        brand_filter: Filter by brand (optional)
        
    Returns:
        dict: {
            'success': bool,
            'created': int,
            'updated': int,
            'errors': list
        }
    """
    try:
        client = get_digiflazz_client()
        
        # Get price list
        products = client.get_price_list(
            cmd="prepaid",
            category=category_filter,
            brand=brand_filter
        )
        
        # Validate response - check if it's an error
        if not isinstance(products, list):
            error_msg = "API returned error or invalid response"
            if isinstance(products, dict):
                error_msg = products.get('message', error_msg)
            logger.error(error_msg)
            return {
                'success': False,
                'created': 0,
                'updated': 0,
                'errors': [error_msg]
            }
        
        logger.info(f"Syncing {len(products)} products from Digiflazz...")
        
        created_count = 0
        updated_count = 0
        errors = []
        
        for df_product in products:
            try:
                # Validate df_product is a dict
                if not isinstance(df_product, dict):
                    logger.warning(f"Skipping invalid product: {df_product}")
                    continue
                
                # Skip inactive products
                if not df_product.get('buyer_product_status') or \
                   not df_product.get('seller_product_status'):
                    continue
                
                # Get or create category (from 'category' field, e.g., "Games")
                category_name = df_product.get('category', 'Uncategorized')
                category_slug = slugify(category_name)
                
                # Try to get existing category by name first
                try:
                    category = Category.objects.get(name=category_name)
                except Category.DoesNotExist:
                    # Create new category with slug
                    category = Category.objects.create(
                        name=category_name,
                        slug=category_slug,
                        is_active=True
                    )
                
                # Get or create product (from 'brand' field, e.g., "MOBILE LEGENDS")
                product_brand = df_product.get('brand', 'Unknown')
                product_slug = slugify(product_brand)
                
                product, created = Product.objects.get_or_create(
                    slug=product_slug,
                    defaults={
                        'name': product_brand,
                        'category': category,
                        'description': f"{product_brand} products",
                        'is_active': True,
                    }
                )
                
                # Update product if exists (ensure it's in the right category)
                if not created:
                    if product.category != category:
                        product.category = category
                        product.save()
                
                # Create or update product item (from 'product_name' field, e.g., "Mobile Legends 100 Diamonds")
                sku_code = df_product['buyer_sku_code']
                
                # Check if product item already exists
                try:
                    product_item = ProductItem.objects.get(sku_code=sku_code)
                    # Product exists - only update price-related fields
                    product_item.base_price = int(df_product['price'])
                    product_item.normal_price = int(df_product['price'])
                    product_item.sell_price = int(df_product['price'])
                    product_item.last_synced_at = timezone.now()
                    product_item.digiflazz_status = 'ACTIVE' if df_product.get('buyer_product_status') else 'INACTIVE'
                    # Only update is_active if it's becoming inactive (don't accidentally activate disabled products)
                    if not df_product.get('buyer_product_status') or not df_product.get('seller_product_status'):
                        product_item.is_active = False
                    product_item.save()
                    updated_count += 1
                    item_created = False
                    logger.info(f"Updated prices for existing product: {sku_code}")
                    
                except ProductItem.DoesNotExist:
                    # Product doesn't exist - create new with all fields
                    product_item = ProductItem.objects.create(
                        sku_code=sku_code,
                        product=product,
                        name=df_product['product_name'],  # Full item name
                        base_price=int(df_product['price']),
                        normal_price=int(df_product['price']),
                        sell_price=int(df_product['price']),
                        is_active=df_product.get('buyer_product_status', True) and df_product.get('seller_product_status', True),
                        last_synced_at=timezone.now(),
                        digiflazz_status='ACTIVE' if df_product.get('buyer_product_status') else 'INACTIVE'
                    )
                    created_count += 1
                    item_created = True
                    logger.info(f"Created new product: {sku_code}")
                    
            except Exception as e:
                sku = df_product.get('buyer_sku_code', 'unknown') if isinstance(df_product, dict) else 'unknown'
                error_msg = f"Error syncing product {sku}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        result = {
            'success': True,
            'created': created_count,
            'updated': updated_count,
            'errors': errors
        }
        
        logger.info(f"✅ Product sync completed - Created: {created_count}, Updated: {updated_count}")
        
        return result
        
    except DigiflazzException as e:
        logger.error(f"Digiflazz API error during sync: {e}")
        
        # Retry dengan exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        
    except Exception as e:
        logger.exception(f"Unexpected error during product sync: {e}")
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
        
        # Extract customer_no from customer_data based on product type
        # Different product types require different field combinations:
        # - Games with server: userId + serverId (concatenated, e.g., Mobile Legends)
        # - Games without server: userId only (e.g., Free Fire, PUBG)
        # - Pulsa: phoneNumber
        # - PLN: meterNumber
        # - Voucher: userId (can be email or account ID)
        customer_data = order.customer_data or {}
        
        # Try different field types based on what's available
        # Priority: phoneNumber > meterNumber > userId (with optional serverId)
        phone_number = customer_data.get('phoneNumber') or customer_data.get('phone_number')
        meter_number = customer_data.get('meterNumber') or customer_data.get('meter_number')
        user_id = customer_data.get('userId') or customer_data.get('user_id') or customer_data.get('gameId')
        
        if phone_number:
            # Pulsa products
            customer_no = str(phone_number)
        elif meter_number:
            # PLN products
            customer_no = str(meter_number)
        elif user_id:
            # Game or Voucher products
            server_id = customer_data.get('serverId') or customer_data.get('server_id') or customer_data.get('zoneId')
            if server_id:
                # Games with server (e.g., Mobile Legends)
                customer_no = f"{user_id}{server_id}"
            else:
                # Games without server or vouchers
                customer_no = str(user_id)
        else:
            raise ValueError("Customer data tidak memiliki field yang diperlukan (userId, phoneNumber, atau meterNumber)")
        
        logger.info(f"Processing top-up for customer_no: {customer_no}")
        
        # Get Digiflazz client
        client = get_digiflazz_client()
        
        # Create transaction
        transaction = client.create_transaction(
            buyer_sku_code=order.product_item.sku_code,
            customer_no=customer_no,
            ref_id=order.order_number,  # Use order_number instead of UUID for ref_id
            testing=False
        )
        
        # Save transaction to database
        df_transaction = DigiflazzTransaction.objects.create(
            order=order,
            ref_id=order.order_number,
            sku_code=transaction.get('buyer_sku_code', ''),
            customer_no=transaction.get('customer_no', ''),
            status=transaction.get('status', ''),
            message=transaction.get('message', ''),
            serial_number=transaction.get('sn', ''),
            response_data=transaction
        )
        
        # Update order based on transaction status
        if client.is_transaction_success(transaction['status'], transaction['rc']):
            order.status = OrderStatus.COMPLETED
            order.completion_data = {
                'serial_number': transaction['sn'],
                'completed_at': timezone.now().isoformat(),
                'buyer_last_saldo': transaction.get('buyer_last_saldo'),
                'price': transaction.get('price')
            }
            logger.info(f"✅ Order {order.id} COMPLETED - SN: {transaction['sn']}")
            
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
        
        # TODO: Send notification to user
        # send_order_notification.delay(str(order.id))
        
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


@shared_task(bind=True, max_retries=3)
def check_order_status(self, order_id):
    """
    Check status order yang masih pending
    
    Args:
        order_id: UUID of the order
        
    Returns:
        dict: Status check result
    """
    try:
        order = Order.objects.select_related('product_item').get(id=order_id)
        
        logger.info(f"Checking status for Order {order.id}")
        
        # Skip jika order sudah completed atau failed
        if order.status in [OrderStatus.COMPLETED, OrderStatus.FAILED, OrderStatus.EXPIRED]:
            logger.info(f"Order {order.id} already {order.status}, skipping status check")
            return {
                'success': True,
                'order_id': str(order.id),
                'status': order.status,
                'message': 'Order already finalized'
            }
        
        # Get latest Digiflazz transaction
        df_transaction = DigiflazzTransaction.objects.filter(
            order=order
        ).order_by('-created_at').first()
        
        if not df_transaction:
            raise ValueError("No Digiflazz transaction found for this order")
        
        # Check status
        client = get_digiflazz_client()
        status_result = client.check_transaction_status(
            buyer_sku_code=df_transaction.sku_code,
            customer_no=df_transaction.customer_no,
            ref_id=df_transaction.ref_id
        )
        
        # Update transaction
        df_transaction.status = status_result['status']
        df_transaction.message = status_result['message']
        df_transaction.serial_number = status_result.get('sn', '')
        df_transaction.response_data = status_result
        df_transaction.save()
        
        # Update order
        if client.is_transaction_success(status_result['status'], status_result['rc']):
            order.status = OrderStatus.COMPLETED
            order.completion_data = {
                'serial_number': status_result['sn'],
                'completed_at': timezone.now().isoformat()
            }
            logger.info(f"✅ Order {order.id} COMPLETED after status check")
            
        elif client.is_transaction_pending(status_result['status'], status_result['rc']):
            # Still pending, check again later
            logger.info(f"⏳ Order {order.id} still PENDING")
            
            # Check if transaction is expired (>90 days)
            if client.is_transaction_expired(df_transaction.created_at):
                order.status = OrderStatus.EXPIRED
                order.failure_reason = "Transaction expired after 90 days"
                logger.warning(f"Order {order.id} expired")
            # Check if timed out (>30 minutes for immediate check)
            elif (timezone.now() - order.created_at).total_seconds() > 1800:
                # Timeout after 30 minutes
                order.status = OrderStatus.FAILED
                order.failure_reason = "Transaction timeout (pending > 30 minutes)"
                logger.warning(f"Order {order.id} timeout")
            else:
                # Schedule check with appropriate delay
                delay_minutes = client.get_retry_delay_minutes(status_result.get('rc', ''))
                check_order_status.apply_async(
                    args=[str(order.id)],
                    countdown=delay_minutes * 60
                )
                
        else:
            order.status = OrderStatus.FAILED
            order.failure_reason = status_result['message']
            logger.warning(f"❌ Order {order.id} FAILED after status check")
        
        order.save()
        
        return {
            'success': True,
            'order_id': str(order.id),
            'status': order.status,
            'message': status_result['message']
        }
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found")
        return {
            'success': False,
            'order_id': str(order_id),
            'message': 'Order not found'
        }
        
    except DigiflazzException as e:
        logger.error(f"Digiflazz error checking Order {order_id}: {e}")
        
        # Retry
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        
    except Exception as e:
        logger.exception(f"Error checking Order {order_id} status: {e}")
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
            service='digiflazz',
            endpoint='/cek-saldo',
            method='POST',
            request_data={'cmd': 'deposit'},
            response_data=balance,
            status_code=200,
            duration_ms=0
        )
        
        # TODO: Send alert if balance < threshold
        # if deposit < 100000:  # Rp 100k
        #     send_low_balance_alert(deposit)
        
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
            order.completion_data = {
                'serial_number': status_response.get('sn', ''),
                'completed_at': timezone.now().isoformat(),
                'buyer_last_saldo': status_response.get('buyer_last_saldo'),
                'price': status_response.get('price')
            }
            order.save()
            
            logger.info(f"✅ Order {order.id} COMPLETED via status check - SN: {status_response.get('sn')}")
            return {'success': True, 'status': 'completed'}
            
        elif client.is_transaction_failed(status_response.get('status', ''), status_response.get('rc', '')):
            # Transaction failed
            order.status = OrderStatus.FAILED
            order.failure_reason = status_response.get('message', 'Transaction failed')
            order.save()
            
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
