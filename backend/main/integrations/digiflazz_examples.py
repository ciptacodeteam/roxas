"""
Example Usage: Digiflazz Integration

Contoh penggunaan Digiflazz API client untuk game top-up
"""

from main.integrations.digiflazz import DigiflazzClient, get_digiflazz_client, DigiflazzException


# ===== 1. INITIALIZE CLIENT =====

# Cara 1: Menggunakan default client (dari environment variables)
client = get_digiflazz_client()

# Cara 2: Inisialisasi manual
client = DigiflazzClient(
    username="your_username",
    api_key="your_api_key",
    environment="production"  # atau "sandbox"
)


# ===== 2. GET PRICE LIST =====

try:
    # Get semua produk prepaid
    all_products = client.get_price_list(cmd="prepaid")
    print(f"Total products: {len(all_products)}")
    
    # Filter by kategori (contoh: Games)
    game_products = client.get_price_list(
        cmd="prepaid",
        category="Games"
    )
    
    # Filter by brand (contoh: Mobile Legends)
    ml_products = client.get_price_list(
        cmd="prepaid",
        brand="MOBILE LEGENDS"
    )
    
    # Get produk spesifik by SKU
    specific_product = client.get_price_list(
        cmd="prepaid",
        buyer_sku_code="ML100"
    )
    
    # Print hasil
    for product in ml_products[:5]:  # Print 5 produk pertama
        print(f"""
        Product: {product['product_name']}
        SKU: {product['buyer_sku_code']}
        Price: Rp {product['price']:,}
        Stock: {'Unlimited' if product['unlimited_stock'] else product['stock']}
        Status: {'Active' if product['buyer_product_status'] else 'Inactive'}
        """)
        
except DigiflazzException as e:
    print(f"Error getting price list: {e}")


# ===== 3. CREATE TRANSACTION =====

try:
    # Create transaksi top-up
    transaction = client.create_transaction(
        buyer_sku_code="ML100",          # SKU produk Anda
        customer_no="1234567890",        # User ID game player
        ref_id="ORDER-2024-12345",       # Order ID dari sistem Anda (HARUS UNIK!)
        testing=False,                   # Set True untuk testing
        max_price=30000,                 # Optional: limit harga max
        callback_url="https://yourdomain.com/webhook"  # Optional: webhook khusus
    )
    
    # Check status transaksi
    status = transaction['status']
    rc = transaction['rc']
    
    if client.is_transaction_success(status, rc):
        print(f"✅ Transaksi SUKSES!")
        print(f"Serial Number: {transaction['sn']}")
        print(f"Price: Rp {transaction['price']:,}")
        
    elif client.is_transaction_pending(status, rc):
        print(f"⏳ Transaksi PENDING - {transaction['message']}")
        print(f"Silakan cek status nanti")
        
    elif client.is_transaction_failed(status, rc):
        print(f"❌ Transaksi GAGAL - {transaction['message']}")
        print(f"Response Code: {rc}")
        
    # Print full response
    print(f"\nFull Response: {transaction}")
    
except DigiflazzException as e:
    print(f"Error creating transaction: {e}")


# ===== 4. CHECK TRANSACTION STATUS =====

try:
    # Check status transaksi yang sudah dibuat sebelumnya
    status_result = client.check_transaction_status(
        buyer_sku_code="ML100",
        customer_no="1234567890",
        ref_id="ORDER-2024-12345"  # Ref ID yang sama dengan transaksi sebelumnya
    )
    
    print(f"Status: {status_result['status']}")
    print(f"Message: {status_result['message']}")
    
    if status_result.get('sn'):
        print(f"Serial Number: {status_result['sn']}")
    
except DigiflazzException as e:
    print(f"Error checking status: {e}")


# ===== 5. CHECK BALANCE =====

try:
    balance = client.get_balance()
    deposit = balance.get('deposit', 0)
    
    print(f"Saldo Digiflazz: Rp {deposit:,}")
    
except DigiflazzException as e:
    print(f"Error getting balance: {e}")


# ===== 6. RESPONSE CODE HELPER =====

# Get deskripsi response code
rc_message = client.get_response_code_message("00")
print(f"RC 00: {rc_message}")  # Sukses

rc_message = client.get_response_code_message("03")
print(f"RC 03: {rc_message}")  # Pending / Proses


# ===== 7. SYNC PRODUCTS TO DATABASE =====

from main.models import Product, ProductItem, Category
from decimal import Decimal

def sync_digiflazz_products():
    """
    Sync produk dari Digiflazz ke database
    
    Fungsi ini akan:
    1. Get daftar harga dari Digiflazz
    2. Update harga produk di database
    3. Tambah produk baru jika belum ada
    """
    try:
        client = get_digiflazz_client()
        
        # Get produk games saja
        products = client.get_price_list(
            cmd="prepaid",
            category="Games"
        )
        
        print(f"Syncing {len(products)} products...")
        
        updated_count = 0
        created_count = 0
        
        for df_product in products:
            # Skip produk yang tidak aktif
            if not df_product['buyer_product_status'] or not df_product['seller_product_status']:
                continue
            
            # Get atau create category
            category, _ = Category.objects.get_or_create(
                name=df_product['brand'],
                defaults={
                    'description': f"Produk {df_product['brand']}",
                    'is_active': True
                }
            )
            
            # Get atau create product
            product, created = Product.objects.get_or_create(
                digiflazz_sku=df_product['buyer_sku_code'],
                defaults={
                    'name': df_product['product_name'],
                    'category': category,
                    'description': df_product.get('desc', ''),
                    'is_active': True,
                    'is_available': True
                }
            )
            
            # Update atau create product item
            product_item, item_created = ProductItem.objects.update_or_create(
                product=product,
                digiflazz_sku=df_product['buyer_sku_code'],
                defaults={
                    'name': df_product['product_name'],
                    'price': df_product['price'],
                    'stock': None if df_product['unlimited_stock'] else df_product['stock'],
                    'is_unlimited_stock': df_product['unlimited_stock'],
                    'is_active': True
                }
            )
            
            if created or item_created:
                created_count += 1
            else:
                updated_count += 1
        
        print(f"✅ Sync complete!")
        print(f"Created: {created_count}, Updated: {updated_count}")
        
    except DigiflazzException as e:
        print(f"❌ Sync failed: {e}")


# ===== 8. PROCESS ORDER WITH DIGIFLAZZ =====

from main.models import Order, DigiflazzTransaction

def process_order_topup(order_id):
    """
    Process order top-up menggunakan Digiflazz
    
    Args:
        order_id: UUID order yang akan diproses
    """
    try:
        order = Order.objects.get(id=order_id)
        
        # Validasi order
        if order.status != Order.OrderStatus.PROCESSING:
            raise ValueError("Order bukan dalam status PROCESSING")
        
        if not order.product_item:
            raise ValueError("Order tidak memiliki product item")
        
        if not order.product_item.digiflazz_sku:
            raise ValueError("Product tidak memiliki Digiflazz SKU")
        
        # Get client
        client = get_digiflazz_client()
        
        # Create transaction
        transaction = client.create_transaction(
            buyer_sku_code=order.product_item.digiflazz_sku,
            customer_no=order.customer_data.get('user_id', ''),  # User ID game
            ref_id=str(order.id),  # Gunakan Order ID sebagai ref_id
            testing=False
        )
        
        # Save ke DigiflazzTransaction
        df_transaction = DigiflazzTransaction.objects.create(
            order=order,
            ref_id=str(order.id),
            buyer_sku_code=transaction['buyer_sku_code'],
            customer_no=transaction['customer_no'],
            status=transaction['status'],
            rc=transaction['rc'],
            message=transaction['message'],
            price=transaction['price'],
            sn=transaction.get('sn', ''),
            raw_response=transaction
        )
        
        # Update order status based on transaction
        if client.is_transaction_success(transaction['status'], transaction['rc']):
            order.status = Order.OrderStatus.COMPLETED
            order.completion_data = {
                'serial_number': transaction['sn'],
                'completed_at': str(timezone.now())
            }
        elif client.is_transaction_pending(transaction['status'], transaction['rc']):
            order.status = Order.OrderStatus.PROCESSING
        else:
            order.status = Order.OrderStatus.FAILED
            order.failure_reason = transaction['message']
        
        order.save()
        
        print(f"✅ Order {order.id} processed - Status: {order.status}")
        
        return df_transaction
        
    except Exception as e:
        print(f"❌ Error processing order: {e}")
        
        # Update order status ke FAILED
        if order:
            order.status = Order.OrderStatus.FAILED
            order.failure_reason = str(e)
            order.save()
        
        raise


# ===== 9. WEBHOOK VALIDATION (untuk views.py) =====

def validate_digiflazz_webhook(request):
    """
    Validate webhook dari Digiflazz
    
    Gunakan di Django view:
    
    from django.views.decorators.csrf import csrf_exempt
    from django.http import JsonResponse
    import json
    
    @csrf_exempt
    def digiflazz_webhook(request):
        if request.method != 'POST':
            return JsonResponse({'error': 'Method not allowed'}, status=405)
        
        # Get webhook secret
        secret = os.environ.get('DIGIFLAZZ_WEBHOOK_SECRET', '')
        
        # Validate signature
        payload = request.body.decode('utf-8')
        signature = request.META.get('HTTP_X_HUB_SIGNATURE', '')
        
        if not DigiflazzClient.validate_webhook_signature(payload, signature, secret):
            return JsonResponse({'error': 'Invalid signature'}, status=403)
        
        # Parse event
        headers = {
            'X-Digiflazz-Event': request.META.get('HTTP_X_DIGIFLAZZ_EVENT', ''),
            'User-Agent': request.META.get('HTTP_USER_AGENT', '')
        }
        
        payload_data = json.loads(payload)
        event = DigiflazzClient.parse_webhook_event(headers, payload_data)
        
        # Process webhook
        if event['transaction_type'] == 'prepaid':
            handle_prepaid_webhook(event)
        
        return JsonResponse({'status': 'ok'})
    """
    pass


def handle_prepaid_webhook(event):
    """
    Handle webhook untuk transaksi prepaid
    
    Args:
        event: Parsed event dari DigiflazzClient.parse_webhook_event()
    """
    data = event['data']
    ref_id = data.get('ref_id')
    
    print(f"Webhook received - Event: {event['event_type']}, Ref ID: {ref_id}")
    
    try:
        # Find transaction by ref_id
        df_transaction = DigiflazzTransaction.objects.get(ref_id=ref_id)
        order = df_transaction.order
        
        # Update transaction
        df_transaction.status = data['status']
        df_transaction.rc = data['rc']
        df_transaction.message = data['message']
        df_transaction.sn = data.get('sn', '')
        df_transaction.raw_response = data
        df_transaction.save()
        
        # Update order based on status
        client = get_digiflazz_client()
        
        if client.is_transaction_success(data['status'], data['rc']):
            order.status = Order.OrderStatus.COMPLETED
            order.completion_data = {
                'serial_number': data['sn'],
                'completed_at': str(timezone.now())
            }
            
        elif client.is_transaction_failed(data['status'], data['rc']):
            order.status = Order.OrderStatus.FAILED
            order.failure_reason = data['message']
        
        order.save()
        
        print(f"✅ Webhook processed - Order {order.id} updated to {order.status}")
        
    except DigiflazzTransaction.DoesNotExist:
        print(f"⚠️ Transaction not found: {ref_id}")
    except Exception as e:
        print(f"❌ Error processing webhook: {e}")
