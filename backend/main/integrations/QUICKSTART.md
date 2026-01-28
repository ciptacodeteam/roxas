# Quick Start Guide - Payment & Fulfillment Integrations

This guide will help you get both Midtrans Core API (payment) and Digiflazz (top-up) integrations up and running.

## 🎯 What You Have Now

### Midtrans Core API Payment Gateway
- **Location**: `backend/main/integrations/midtrans.py`
- **Documentation**: `backend/main/integrations/MIDTRANS_CORE_API.md`
- **Webhook**: `backend/main/webhooks.py` (midtrans_webhook function)
- **URLs**: `backend/main/urls.py` (/webhooks/midtrans/)
- **Type**: Core API (custom payment flow, full UI control)

### Digiflazz Top-Up Service
- **Location**: `backend/main/integrations/digiflazz.py`
- **Examples**: `backend/main/integrations/digiflazz_examples.py`
- **Documentation**: `backend/main/integrations/README.md`
- **Webhook**: `backend/main/webhooks.py` (digiflazz_webhook function)
- **Tasks**: `backend/main/tasks.py` (Celery async tasks)
- **URLs**: `backend/main/urls.py` (/webhooks/digiflazz/)

### Seed Command
- **Location**: `backend/main/management/commands/seed_data.py`
- **Usage**: `python manage.py seed_data`
- **Seeds**: Admin user, Payment methods (12), Coupons (6)

---

## 🚀 Setup Steps

### Step 1: Environment Variables

Add to your `backend/.env` file:

```bash
# ============================================
# MIDTRANS CORE API
# ============================================
# Get from: https://dashboard.sandbox.midtrans.com (or production)
MIDTRANS_SERVER_KEY=SB-Mid-server-your_key_here
MIDTRANS_PRODUCTION=False  # Set True for production

# ============================================
# DIGIFLAZZ GAME TOP-UP
# ============================================
# Get from: https://member.digiflazz.com
DIGIFLAZZ_USERNAME=your_username
DIGIFLAZZ_API_KEY=your_api_key
DIGIFLAZZ_ENVIRONMENT=production
DIGIFLAZZ_API_URL=https://api.digiflazz.com/v1
DIGIFLAZZ_WEBHOOK_SECRET=your_webhook_secret
DIGIFLAZZ_WEBHOOK_URL=https://yourdomain.com/api/main/webhooks/digiflazz/
```

### Step 2: Update Django Settings

Ensure these are in `backend/backend/settings.py`:

```python
# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Midtrans settings
MIDTRANS_SERVER_KEY = os.getenv('MIDTRANS_SERVER_KEY')
MIDTRANS_CLIENT_KEY = os.getenv('MIDTRANS_CLIENT_KEY')
MIDTRANS_PRODUCTION = os.getenv('MIDTRANS_PRODUCTION', 'False').lower() == 'true'

# Digiflazz settings
DIGIFLAZZ_USERNAME = os.getenv('DIGIFLAZZ_USERNAME')
DIGIFLAZZ_API_KEY = os.getenv('DIGIFLAZZ_API_KEY')
DIGIFLAZZ_ENVIRONMENT = os.getenv('DIGIFLAZZ_ENVIRONMENT', 'production')
DIGIFLAZZ_WEBHOOK_SECRET = os.getenv('DIGIFLAZZ_WEBHOOK_SECRET')
```

### Step 3: Run Migrations

If you've added Payment or DigiflazzTransaction models:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Step 4: Start Celery Worker

For async task processing (Digiflazz):

```bash
# Terminal 1: Start Celery worker
celery -A backend worker -l info

# Terminal 2: Start Celery beat (for scheduled tasks)
celery -A backend beat -l info
```

### Step 4: Setup Ngrok for Development Webhooks

Ngrok allows Midtrans and Digiflazz to send webhooks to your local development server.

**Install ngrok:**
```powershell
# Windows - Chocolatey
choco install ngrok

# Or download from: https://ngrok.com/download
```

**Configure ngrok:**
1. Sign up at: https://dashboard.ngrok.com/signup
2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Edit `backend/ngrok.yml` and replace `YOUR_NGROK_AUTHTOKEN_HERE` with your token

**Start dev server with ngrok:**
```powershell
cd backend
.\start-dev-with-ngrok.ps1
```

**Get your ngrok URL** from terminal output:
```
https://abc123.ngrok.io
```

**Update webhook URLs** in dashboards:
- Midtrans: `https://abc123.ngrok.io/api/main/webhooks/midtrans/`
- Digiflazz: `https://abc123.ngrok.io/api/main/webhooks/digiflazz/`

📖 Full ngrok guide: [NGROK_SETUP.md](../NGROK_SETUP.md)

### Step 5: Test Webhooks

Use ngrok or similar for testing webhooks:

```bash
# Install ngrok
# Download from: https://ngrok.com

# Start ngrok
ngrok http 8000

# Update webhook URLs in:
# - Midtrans Dashboard: https://xxxx.ngrok.io/api/main/webhooks/midtrans/
# - Digiflazz Dashboard: https://xxxx.ngrok.io/api/main/webhooks/digiflazz/
```

---

## 📝 Usage Examples

### Example 1: Create Payment for Order

```python
from main.integrations.midtrans_examples import example_create_payment_for_order

# Create payment for order ID 123
result = example_create_payment_for_order(order_id=123)

if result['success']:
    # Return to frontend
    return {
        'payment_token': result['token'],
        'payment_url': result['redirect_url'],
        'client_key': result['client_key'],
    }
```

### Example 2: Process Order After Payment

This happens automatically via webhook, but you can also trigger manually:

```python
from main.tasks import process_order_topup

# Process top-up for order (runs in Celery)
process_order_topup.delay(order_id=123)
```

### Example 3: Sync Digiflazz Products

```python
from main.tasks import sync_digiflazz_products

# Sync all game products
sync_digiflazz_products.delay()

# Or sync specific category
sync_digiflazz_products.delay(category_filter='Games')
```

### Example 4: Check Payment Status

```python
from main.integrations.midtrans_examples import example_check_payment_status

# Check status of order payment
status = example_check_payment_status(order_id=123)

print(f"Status: {status['transaction_status']}")
print(f"Message: {status['status_message']}")
```

---

## 🧪 Testing

### Test Midtrans Payment

1. **Create test payment**:
   ```python
   from main.integrations.midtrans import get_midtrans_client
   
   client = get_midtrans_client()
   response = client.create_snap_transaction(
       order_id='TEST-001',
       gross_amount=100000,
       customer_details={
           'first_name': 'Test',
           'email': 'test@example.com',
       }
   )
   print(f"Payment URL: {response['redirect_url']}")
   ```

2. **Visit payment URL** and pay with test card:
   - Card: 4811 1111 1111 1114
   - CVV: 123
   - Expiry: 12/25
   - OTP: 112233

3. **Check webhook received**:
   ```bash
   # Monitor logs
   tail -f logs/webhook.log
   ```

### Test Digiflazz Top-Up

1. **Sync products**:
   ```python
   from main.tasks import sync_digiflazz_products
   sync_digiflazz_products.delay()
   ```

2. **Create test transaction**:
   ```python
   from main.integrations.digiflazz import get_digiflazz_client
   
   client = get_digiflazz_client()
   result = client.create_transaction(
       buyer_sku_code='mobilelegend',
       customer_no='123456789',
       ref_id='TEST-001',
       testing=True  # Important: testing mode
   )
   ```

3. **Check webhook received**:
   ```bash
   curl http://localhost:8000/api/main/webhooks/digiflazz/ping/
   ```

---

## 🔍 Troubleshooting

### Midtrans Issues

**Problem**: "Invalid signature" error in webhook
**Solution**: Check that `MIDTRANS_SERVER_KEY` is correct and matches the one in Midtrans dashboard

**Problem**: Payment popup doesn't show
**Solution**: 
- Check that `MIDTRANS_CLIENT_KEY` is loaded in frontend
- Verify Snap.js script is loaded correctly
- Check browser console for errors

**Problem**: Webhook not received
**Solution**:
- Test webhook endpoint: `curl http://yoursite.com/api/main/webhooks/midtrans/ping/`
- Check Midtrans dashboard → Settings → Notification URL
- Verify server is accessible from internet (use ngrok for local testing)

### Digiflazz Issues

**Problem**: "Authentication failed" error
**Solution**: 
- Verify `DIGIFLAZZ_USERNAME` and `DIGIFLAZZ_API_KEY`
- Check MD5 signature generation in logs

**Problem**: "IP not whitelisted" error
**Solution**: 
- Login to Digiflazz dashboard
- Go to Settings → API Connection
- Add your server IP to whitelist

**Problem**: Celery tasks not running
**Solution**:
- Check Celery worker is running: `celery -A backend worker -l info`
- Check Redis/RabbitMQ is running
- Verify `CELERY_BROKER_URL` in settings

---

## 📊 Complete Order Flow Example

Here's how everything works together:

```python
# 1. Customer visits product page
# Frontend: Display products from database (synced via Digiflazz)

# 2. Customer creates order
from main.models import Order, OrderItem

order = Order.objects.create(
    user=request.user,
    total=100000,
    status='PENDING'
)
OrderItem.objects.create(
    order=order,
    product=product,
    quantity=1,
    price=100000
)

# 3. Create payment
from main.integrations.midtrans_examples import example_create_payment_for_order

payment_data = example_create_payment_for_order(order.id)

# Return to frontend:
# {
#   'token': 'abc-123',
#   'redirect_url': 'https://app.sandbox.midtrans.com/...'
# }

# 4. Customer pays via Midtrans Snap
# Frontend shows payment popup using Snap.js

# 5. Midtrans sends webhook (automatic)
# POST to /api/main/webhooks/midtrans/
# - Validates signature
# - Updates Order status to PROCESSING
# - Updates Payment status to success
# - Triggers process_order_topup.delay(order.id)

# 6. Celery processes top-up (automatic)
# - Gets order details
# - Calls Digiflazz API
# - Creates DigiflazzTransaction record
# - Waits for confirmation

# 7. Digiflazz sends webhook (automatic)
# POST to /api/main/webhooks/digiflazz/
# - Validates signature
# - Updates DigiflazzTransaction status
# - Updates Order status to COMPLETED
# - Sends notification to customer

# 8. Customer receives game credits!
```

---

## 📚 Documentation Links

- **Midtrans Full Guide**: [MIDTRANS_README.md](./MIDTRANS_README.md)
- **Digiflazz Full Guide**: [README.md](./README.md)
- **Midtrans Official Docs**: https://docs.midtrans.com
- **Digiflazz Official Docs**: https://developer.digiflazz.com

---

## 🎓 Next Steps

1. **Test in Sandbox**
   - Get sandbox credentials for both services
   - Test complete order flow
   - Verify webhooks are received

2. **Implement Frontend**
   - Add payment button using Snap.js
   - Show order status updates
   - Handle payment callbacks

3. **Add Notifications**
   - Email notifications for order updates
   - SMS notifications for top-up success
   - Push notifications (optional)

4. **Monitor & Log**
   - Set up error tracking (Sentry)
   - Monitor API calls in database
   - Alert on failed transactions

5. **Production Deployment**
   - Switch to production credentials
   - Set up HTTPS
   - Configure webhook URLs
   - Test with real payments (small amounts)

---

## 💡 Tips

- **Always test in sandbox first** before using production credentials
- **Monitor webhook logs** to debug integration issues
- **Use Celery for async processing** to avoid blocking requests
- **Implement idempotency** to handle duplicate webhooks
- **Set up alerts** for failed transactions or low Digiflazz balance
- **Keep API keys secure** - never commit to Git

---

## 🆘 Support

If you encounter issues:

1. Check the specific documentation (MIDTRANS_README.md or README.md)
2. Review logs in `logs/` directory
3. Test webhook endpoints with ping URLs
4. Contact Midtrans/Digiflazz support for API issues

---

**Version**: 1.0  
**Last Updated**: 2024-01-15  
**Maintainer**: Roxas Backend Team
