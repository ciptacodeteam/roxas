# Transaction Flow Setup Complete ✓

## Configuration Summary

### Backend Environment (✓ Configured)
- **Django Backend**: `http://localhost:8000`
- **Digiflazz API**: Development credentials configured
  - Username: `julexigNJYXg`
  - Webhook Secret: `ciptacode`
- **Midtrans API**: Sandbox credentials configured
  - Server Key: `Mid-server-SemNJr2BsvmZzcggd8w8On5q`
- **Database**: PostgreSQL (Docker)
  - Database: `roxas`
  - User: `postgres`

### Frontend Environment (✓ Configured)
- **Next.js Frontend**: `http://localhost:3000`
- **API Connection**: Points to Django backend at `http://localhost:8000`
- **Session Auth**: Uses Django session cookies (no JWT tokens)

---

## Implementation Complete

### ✅ Backend Features
1. **Mobile Legends Validation Endpoint** (`/api/v1/product-items/validate-ml-id/`)
   - Validates user ID + server ID using Digiflazz MLCU SKU
   - Returns account name on success
   - MLCU items filtered from public product list

2. **Order Creation Endpoint** (`/api/v1/orders/`)
   - Full coupon validation with usage limits
   - Pricing calculation: subtotal + fees - discount + VAT
   - Creates Order and Payment records
   - Supports QRIS, E-Wallet, Bank Transfer

3. **Celery Task Processing** (`process_order_topup`)
   - Async Digiflazz transaction processing
   - Proper userId+serverId concatenation for Mobile Legends
   - Retry logic with exponential backoff

4. **Webhook Handlers**
   - Midtrans payment notifications
   - Digiflazz fulfillment callbacks
   - Signature validation for security

### ✅ Frontend Features
1. **Product Detail Page** (ProductDetailClient.tsx)
   - Mobile Legends account verification
   - Coupon application with discount display
   - Multiple payment method selection
   - Order creation with payment instructions

2. **API Integration** (queries.ts)
   - All endpoints migrated to Django backend
   - Proper field name mapping (camelCase → snake_case)
   - Session-based authentication

---

## Quick Start Guide

### 1. Start Backend Services

```powershell
# Terminal 1: Start Docker containers (PostgreSQL, Redis, Celery)
cd backend
docker-compose up -d

# Terminal 2: Start Django development server
cd backend
python manage.py runserver

# Terminal 3: Start Celery worker for async tasks
cd backend
celery -A backend worker -l info -P solo
```

### 2. Start Frontend

```powershell
# Terminal 4: Start Next.js frontend
cd frontend
bun dev
```

### 3. Test the Flow

1. **Navigate to Mobile Legends product page**
   - http://localhost:3000/product/mobile-legends

2. **Validate Account**
   - Enter User ID: `123456789`
   - Enter Server ID: `1234`
   - Click "Verify Account"
   - Should display account name

3. **Select Diamond Package**
   - Choose any diamond package (e.g., 50 diamonds)

4. **Apply Coupon (Optional)**
   - Enter coupon code if available
   - Click "Apply"
   - Discount should be calculated

5. **Select Payment Method**
   - QRIS for QR code payment
   - GoPay/ShopeePay for e-wallet
   - Bank Transfer for VA number

6. **Create Order**
   - Click "Order Now"
   - Payment instructions will be displayed
   - Order status updates via webhook

---

## Testing the Integration

Run the automated test script to verify all integrations:

```powershell
cd backend
python test_transaction_flow.py
```

This will test:
- ✓ Digiflazz API connection and MLCU validation
- ✓ Midtrans payment gateway connection
- ✓ Database models and configuration

---

## Transaction Flow Sequence

```
1. User enters Mobile Legends account details
   → Frontend calls /api/v1/product-items/validate-ml-id/
   → Backend validates via Digiflazz MLCU (testing=true)
   → Returns account name

2. User selects diamond package and applies coupon
   → Frontend calls /api/v1/coupons/validate/
   → Backend validates coupon code, usage limits, expiration
   → Returns discount amount

3. User selects payment method and creates order
   → Frontend calls /api/v1/orders/
   → Backend creates Order + Payment records
   → Initiates Midtrans payment (QRIS/VA/E-Wallet)
   → Returns payment instructions

4. User completes payment
   → Midtrans sends webhook to /api/v1/webhooks/midtrans/
   → Backend updates Payment status to SETTLED
   → Order status changes to PAID
   → Triggers Celery task: process_order_topup

5. Celery processes fulfillment
   → Calls Digiflazz create_transaction (testing=false)
   → Creates DigiflazzTransaction record
   → Waits for Digiflazz webhook

6. Digiflazz sends fulfillment result
   → Webhook arrives at /api/v1/webhooks/digiflazz/
   → Backend updates Order status:
     - Code 00 → COMPLETED (with serial number)
     - Code 03 → PROCESSING
     - Code 01/39 → FAILED
   → User receives order completion notification
```

---

## API Endpoint Reference

### Product Validation
```http
POST /api/v1/product-items/validate-ml-id/
Content-Type: application/json

{
  "user_id": "123456789",
  "server_id": "1234"
}

Response:
{
  "success": true,
  "account_name": "PlayerName123"
}
```

### Coupon Validation
```http
POST /api/v1/coupons/validate/
Content-Type: application/json

{
  "code": "DISCOUNT50",
  "order_amount": 50000
}

Response:
{
  "valid": true,
  "discount_amount": 5000,
  "coupon": {
    "code": "DISCOUNT50",
    "discount_type": "percentage",
    "discount_value": 10
  }
}
```

### Order Creation
```http
POST /api/v1/orders/
Content-Type: application/json

{
  "product_item": "uuid-of-diamond-package",
  "customer_data": {
    "userId": "123456789",
    "serverId": "1234"
  },
  "payment_method": "uuid-of-payment-method",
  "coupon_code": "DISCOUNT50"
}

Response:
{
  "id": "uuid",
  "order_number": "ORD-20260130-ABC123",
  "status": "PENDING",
  "total_amount": 47500,
  "payment": {
    "payment_type": "QRIS",
    "qris_string": "00020101021126...",
    "status": "PENDING"
  }
}
```

---

## Environment Variables Required

### Frontend (.env)
```env
# Already configured ✓
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

---

## Troubleshooting

### Issue: "Cannot connect to backend API"
**Solution**: Ensure Django is running on port 8000
```powershell
cd backend
python manage.py runserver
```

### Issue: "MLCU validation fails"
**Solution**: Check Digiflazz credentials in backend/.env
```powershell
# Test connection
cd backend
python test_transaction_flow.py
```

### Issue: "Payment creation fails"
**Solution**: Verify Midtrans credentials
- Check MIDTRANS_SERVER_KEY in backend/.env
- Ensure Midtrans sandbox is accessible

### Issue: "Order stuck in PAID status"
**Solution**: Start Celery worker
```powershell
cd backend
celery -A backend worker -l info -P solo
```

### Issue: "Webhook not received"
**Solution**: For local development, use ngrok for public URL
```powershell
# Start ngrok
ngrok http 8000

# Update webhook URLs in:
# - Midtrans dashboard: https://dashboard.sandbox.midtrans.com/
# - Digiflazz dashboard: https://member.digiflazz.com/
```

---

## Production Deployment Notes

When deploying to production:

1. **Update Environment Variables**
   ```env
   DEBUG=false
   MIDTRANS_IS_PRODUCTION=true
   DIGIFLAZZ_IS_PRODUCTION=true
   ALLOWED_HOSTS=yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com
   ```

2. **Use Production API Keys**
   - Get production keys from Midtrans dashboard
   - Get production keys from Digiflazz member area

3. **Configure Webhooks**
   - Set webhook URLs to your production domain
   - Enable HTTPS (required by Midtrans)

4. **Database Migration**
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

5. **Process Management**
   - Use Gunicorn for Django: `gunicorn backend.wsgi:application`
   - Use systemd or supervisor for Celery
   - Configure nginx as reverse proxy

---

## Next Steps

1. ✓ Environment configured
2. ✓ All code implemented
3. → **Run test script**: `python backend/test_transaction_flow.py`
4. → **Start all services** (Django, Celery, Frontend)
5. → **Test complete flow** with real Mobile Legends account
6. → **Monitor logs** for any issues

---

**All transaction flow implementation is complete and ready for testing!** 🚀
