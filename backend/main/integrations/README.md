# Payment & Fulfillment Integrations - Roxas Game Store

Complete payment gateway and game top-up integrations for the Roxas Game Store backend.

## 📦 Integrations

### 1. **Midtrans Core API** - Payment Gateway
Indonesian payment gateway with custom payment flow.

**Features:**
- ✅ Core API integration (full UI control)
- ✅ Multiple payment methods (QRIS, e-wallet, bank VA, credit card)
- ✅ Custom payment flow matching your brand
- ✅ Transaction status checking
- ✅ Refund processing
- ✅ Webhook notifications with SHA512 signature validation
- ✅ Comprehensive error handling and logging

**Documentation:** [MIDTRANS_CORE_API.md](./MIDTRANS_CORE_API.md)

### 2. **Digiflazz** - Game Top-Up Provider
Indonesian game top-up service for digital product fulfillment.

**Features:**
- ✅ Product catalog synchronization
- ✅ Automated top-up processing
- ✅ Transaction status tracking
- ✅ Webhook notifications with HMAC SHA1 validation
- ✅ Celery tasks for async processing
- ✅ Automatic retry with exponential backoff

**Documentation:** Continue reading this file

---

## 🔄 Complete Order Flow

```
1. Customer Creates Order
   ↓
   Order Status: PENDING
   Calculate payment fees

2. Payment via Midtrans Core API
   ↓
   Customer selects payment method
   Backend calls charge API
   Payment instructions returned
   (VA number, QR code, deeplink, etc.)

3. Customer Pays
   ↓
   Midtrans webhook: payment success
   Order Status: PAID

4. Product Fulfillment via Digiflazz
   ↓
   Celery task triggers top-up
   Digiflazz processes transaction
   Digiflazz webhook: top-up success
   Order Status: COMPLETED

5. Customer Receives Credits
   ↓
   Game credits delivered
   Notification sent to customer
```

---

## 🚀 Quick Start

### Run Seed Command

```bash
cd backend
python manage.py seed_data
```

This creates:
- Admin user
- 12 Payment methods with fees
- 6 Promotional coupons

---

# Digiflazz Integration Documentation

## 📋 Features

- ✅ Get price list produk game
- ✅ Create transaksi top-up
- ✅ Check status transaksi
- ✅ Webhook handler untuk notifikasi real-time
- ✅ Celery tasks untuk async processing
- ✅ Automatic retry dengan exponential backoff
- ✅ Signature validation untuk security
- ✅ Comprehensive logging & error handling

## 🔧 Setup

### 1. Environment Variables

Tambahkan ke `.env` file:

```bash
# Digiflazz Configuration
DIGIFLAZZ_USERNAME=your_username
DIGIFLAZZ_API_KEY=your_api_key
DIGIFLAZZ_ENVIRONMENT=production  # atau 'sandbox' untuk testing
DIGIFLAZZ_API_URL=https://api.digiflazz.com/v1
DIGIFLAZZ_WEBHOOK_SECRET=your_webhook_secret
DIGIFLAZZ_WEBHOOK_URL=https://yourdomain.com/api/v1/webhooks/digiflazz/
```

**Cara mendapatkan credentials:**
1. Login ke [member.digiflazz.com](https://member.digiflazz.com)
2. Pergi ke **Pengaturan → Koneksi API**
3. Dapatkan Username dan API Key
4. Whitelist IP server Anda
5. Set Webhook URL dan Secret

### 2. URL Configuration

Tambahkan ke `main/urls.py`:

```python
from main.webhooks import digiflazz_webhook, digiflazz_webhook_ping

urlpatterns = [
    # ... existing patterns ...
    
    # Digiflazz webhook
    path('webhooks/digiflazz/', digiflazz_webhook, name='digiflazz_webhook'),
    path('webhooks/digiflazz/ping/', digiflazz_webhook_ping, name='digiflazz_webhook_ping'),
]
```

### 3. Model Updates

Tambahkan field `digiflazz_sku` ke models (sudah ada di models.py):

```python
class Product(UUIDModel):
    digiflazz_sku = models.CharField(max_length=50, blank=True, null=True)
    # ...

class ProductItem(UUIDModel):
    digiflazz_sku = models.CharField(max_length=50, blank=True, null=True)
    # ...
```

### 4. Celery Beat Schedule (Optional)

Untuk auto-sync products dan balance monitoring, tambahkan ke `backend/settings.py`:

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'sync-digiflazz-products': {
        'task': 'main.tasks.sync_digiflazz_products',
        'schedule': crontab(hour=2, minute=0),  # Setiap hari jam 2 pagi
    },
    'check-digiflazz-balance': {
        'task': 'main.tasks.sync_digiflazz_balance',
        'schedule': crontab(hour='*/6'),  # Setiap 6 jam
    },
    'cleanup-api-logs': {
        'task': 'main.tasks.cleanup_old_api_logs',
        'schedule': crontab(day_of_week=0, hour=3, minute=0),  # Setiap Minggu jam 3 pagi
    },
}
```

## 📚 Usage

### Basic Client Usage

```python
from main.integrations.digiflazz import get_digiflazz_client, DigiflazzException

# Get client
client = get_digiflazz_client()

# Get price list
products = client.get_price_list(cmd="prepaid", category="Games")

# Create transaction
transaction = client.create_transaction(
    buyer_sku_code="ML100",
    customer_no="1234567890",  # User ID game
    ref_id="ORDER-123456"      # Your order ID
)

# Check status
status = client.check_transaction_status(
    buyer_sku_code="ML100",
    customer_no="1234567890",
    ref_id="ORDER-123456"
)

# Check balance
balance = client.get_balance()
print(f"Saldo: Rp {balance['deposit']:,}")
```

### Sync Products to Database

```python
# Manual sync
from main.tasks import sync_digiflazz_products

result = sync_digiflazz_products.delay()
print(result.get())

# Atau langsung
from main.integrations.digiflazz_examples import sync_digiflazz_products
sync_digiflazz_products()
```

### Process Order

```python
from main.tasks import process_order_topup

# Async processing (recommended)
process_order_topup.delay(order_id)

# Or synchronous
result = process_order_topup(order_id)
```

### Handle Webhook in Views

Webhook sudah di-handle otomatis di `main/webhooks.py`. Hanya perlu:

1. Set webhook URL di Digiflazz dashboard
2. Set `DIGIFLAZZ_WEBHOOK_SECRET` di environment
3. Webhook akan otomatis update order status

## 🔄 Order Flow

### 1. Customer Membuat Order

```python
# Di views.py atau serializers.py
from main.tasks import process_order_topup

def create_order(request):
    # ... create order logic ...
    
    order = Order.objects.create(
        user=request.user,
        product_item=product_item,
        customer_data={
            'user_id': request.data.get('game_user_id'),
            'server': request.data.get('server'),
            # ... other data ...
        },
        status=Order.OrderStatus.PENDING
    )
    
    # Process payment first...
    # After payment success:
    order.status = Order.OrderStatus.PROCESSING
    order.save()
    
    # Process top-up async
    process_order_topup.delay(str(order.id))
    
    return order
```

### 2. Payment Success → Process Top-up

```python
# Di payment webhook handler
def handle_payment_success(order):
    order.status = Order.OrderStatus.PROCESSING
    order.save()
    
    # Trigger top-up
    process_order_topup.delay(str(order.id))
```

### 3. Digiflazz Processing

Task `process_order_topup` akan:
- Call Digiflazz API untuk create transaction
- Save transaction ke `DigiflazzTransaction` model
- Update order status based on response:
  - **Sukses (RC=00)**: Order → COMPLETED
  - **Pending (RC=03)**: Schedule status check
  - **Gagal**: Order → FAILED

### 4. Webhook Update (Real-time)

Ketika status transaksi berubah di Digiflazz:
- Digiflazz mengirim webhook ke `/webhooks/digiflazz/`
- Webhook handler update order status
- Send notification ke user (TODO)

### 5. Status Check (Fallback)

Jika transaksi pending:
- Task `check_order_status` dijadwalkan
- Check status setiap 5 menit
- Max 30 menit, setelah itu mark as FAILED

## 🔐 Security

### 1. Webhook Signature Validation

Semua webhook divalidasi dengan HMAC SHA1:

```python
# Otomatis di webhooks.py
if not DigiflazzClient.validate_webhook_signature(payload, signature, secret):
    return JsonResponse({'error': 'Invalid signature'}, status=403)
```

### 2. IP Whitelist

Pastikan hanya IP Digiflazz yang bisa akses webhook:

```nginx
# Di nginx.conf
location /api/v1/webhooks/digiflazz/ {
    # Whitelist Digiflazz IP
    allow 52.74.250.133;
    deny all;
    
    proxy_pass http://backend;
}
```

### 3. Rate Limiting

Webhook sudah di-handle dengan rate limiting di nginx (configured).

## 📊 Monitoring

### API Logs

Semua request/response disimpan di `ApiLog` model:

```python
from main.models import ApiLog

# View logs
logs = ApiLog.objects.filter(service='digiflazz').order_by('-created_at')

# Filter by status
failed_logs = ApiLog.objects.filter(
    service='digiflazz',
    status_code__gte=400
)
```

### Digiflazz Transactions

Semua transaksi disimpan di `DigiflazzTransaction` model:

```python
from main.models import DigiflazzTransaction

# View transactions
transactions = DigiflazzTransaction.objects.all()

# Filter by status
pending = DigiflazzTransaction.objects.filter(status='Pending')
success = DigiflazzTransaction.objects.filter(status='Sukses')
failed = DigiflazzTransaction.objects.filter(status='Gagal')
```

### Balance Monitoring

```python
# Manual check
from main.tasks import sync_digiflazz_balance
result = sync_digiflazz_balance.delay()

# Or dengan Celery Beat (auto every 6 hours)
```

## 🧪 Testing

### 1. Test Mode

Set `DIGIFLAZZ_ENVIRONMENT=sandbox` untuk testing:

```python
client = get_digiflazz_client()

# Transaksi akan menggunakan testing=True
transaction = client.create_transaction(
    buyer_sku_code="ML100",
    customer_no="1234567890",
    ref_id="TEST-123",
    testing=True  # Otomatis True jika environment=sandbox
)
```

### 2. Test Cases

Lihat dokumentasi test cases: https://developer.digiflazz.com/api/buyer/test-case/

### 3. Webhook Testing

```bash
# Test ping
curl -X POST https://yourdomain.com/api/v1/webhooks/digiflazz/ping/

# Test webhook dengan dummy data
curl -X POST https://yourdomain.com/api/v1/webhooks/digiflazz/ \
  -H "Content-Type: application/json" \
  -H "X-Digiflazz-Event: create" \
  -H "User-Agent: Digiflazz-Hookshot" \
  -d '{
    "data": {
      "ref_id": "TEST-123",
      "status": "Sukses",
      "rc": "00"
    }
  }'
```

## 🐛 Troubleshooting

### Problem: "Invalid signature" di webhook

**Solution:**
- Pastikan `DIGIFLAZZ_WEBHOOK_SECRET` sama dengan yang di dashboard
- Check payload tidak di-modify (gunakan `request.body` raw)

### Problem: Transaksi pending terus

**Solution:**
- Check balance di Digiflazz
- Verify SKU code benar
- Check customer_no format sesuai requirement game
- Lihat response message dari Digiflazz

### Problem: Product sync gagal

**Solution:**
- Check credentials (username, api_key)
- Verify IP sudah di-whitelist
- Check network/firewall settings

### Problem: Celery task tidak jalan

**Solution:**
```bash
# Check Celery worker running
docker-compose ps

# View Celery logs
docker-compose logs -f celery

# Restart Celery
docker-compose restart celery
```

## 📖 API Reference

### DigiflazzClient Methods

```python
class DigiflazzClient:
    def get_price_list(cmd, buyer_sku_code=None, category=None, brand=None, product_type=None)
    def create_transaction(buyer_sku_code, customer_no, ref_id, testing=False, max_price=None, callback_url=None)
    def check_transaction_status(buyer_sku_code, customer_no, ref_id)
    def get_balance()
    def get_response_code_message(rc)
    def is_transaction_success(status, rc)
    def is_transaction_pending(status, rc)
    def is_transaction_failed(status, rc)
    
    @staticmethod
    def validate_webhook_signature(payload, signature_header, secret)
    
    @staticmethod
    def parse_webhook_event(headers, payload)
```

### Response Codes

| RC | Status | Deskripsi |
|----|--------|-----------|
| 00 | Sukses | Transaksi berhasil |
| 01 | Gagal | Transaksi gagal |
| 03 | Pending | Transaksi sedang diproses |
| 07 | Duplikat | Transaksi duplikat |
| 13 | Gangguan | Produk sedang gangguan |
| 14 | Not Found | Produk tidak ditemukan |
| 201 | Insufficient | Saldo tidak cukup |

Full list: https://developer.digiflazz.com/api/buyer/response-code/

## 🔗 Resources

- **Digiflazz API Docs**: https://developer.digiflazz.com/api/
- **Member Dashboard**: https://member.digiflazz.com
- **Support**: https://digiflazz.com/kontak

## 📝 TODO

- [ ] Add notification system (email, push)
- [ ] Add refund logic for failed transactions
- [ ] Add balance alert system
- [ ] Add transaction analytics/reporting
- [ ] Add postpaid support (if needed)
- [ ] Add webhook retry logic
