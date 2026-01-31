# 🚀 Roxas Game Store - Quick Start Guide

## ✅ System Status: **READY FOR TESTING**

All transaction flow components are implemented and tested:
- ✅ Digiflazz API Integration (Mobile Legends validation & fulfillment)
- ✅ Midtrans Payment Gateway (QRIS, E-Wallet, Bank Transfer)
- ✅ Database Models (Orders, Payments, Coupons)
- ✅ Frontend-Backend API Integration
- ✅ Celery Async Task Processing
- ✅ Webhook Handlers

---

## 🐳 Starting with Docker (Recommended)

### 1. Start Backend Services

```powershell
# Navigate to backend
cd D:\Website\roxas\backend

# Start all Docker containers (PostgreSQL, Redis, Django, Celery)
docker-compose up -d

# Verify containers are running
docker-compose ps

# Expected output:
# backend-api-1           Running
# backend-celery-1        Running  
# backend-celery-beat-1   Running
# backend-db-1            Running (healthy)
# backend-redis-1         Running (healthy)
```

### 2. Start Frontend

```powershell
# Open a new terminal
cd D:\Website\roxas\frontend

# Install dependencies (if not already done)
bun install

# Start Next.js development server
bun dev

# Frontend will be available at: http://localhost:3000
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

---

## 🧪 Testing the Transaction Flow

### Mobile Legends Top-Up Test

1. **Navigate to Mobile Legends Product**
   ```
   http://localhost:3000/product/mobile-legends
   ```

2. **Validate Account**
   - Enter User ID: `123456789`
   - Enter Server ID: `1234`
   - Click "Verify Account"
   - ✓ Should display account validation result

3. **Select Diamond Package**
   - Choose any diamond package (e.g., 50, 100, 500 diamonds)

4. **Apply Coupon (Optional)**
   - If you have a coupon code, enter it
   - Click "Apply"
   - ✓ Discount should be calculated and displayed

5. **Select Payment Method**
   - **QRIS**: Scan QR code with any e-wallet
   - **E-Wallet**: GoPay or ShopeePay deeplink
   - **Bank Transfer**: Virtual Account number

6. **Create Order**
   - Click "Order Now"
   - ✓ Order created with payment instructions
   - ✓ Payment status: PENDING

7. **Complete Payment** (Sandbox Testing)
   - For sandbox testing, use Midtrans simulator:
     https://simulator.sandbox.midtrans.com/

8. **Check Order Status**
   - After webhook received → Payment: SETTLED
   - Celery processes Digiflazz fulfillment
   - Digiflazz webhook → Order: COMPLETED
   - ✓ Serial number/game top-up code received

---

## 📋 Monitoring & Logs

### View Docker Container Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api        # Django backend
docker-compose logs -f celery     # Celery worker
docker-compose logs -f db         # PostgreSQL
docker-compose logs -f redis      # Redis
```

### Check Celery Tasks

```powershell
# Access Django container
docker-compose exec api bash

# Open Django shell
python manage.py shell

# Check pending tasks
from main.models import Order
Order.objects.filter(status='PAID')

# Check completed orders
Order.objects.filter(status='COMPLETED')
```

---

## 🔧 Common Commands

### Backend (Docker)

```powershell
# Stop all containers
docker-compose down

# Restart specific service
docker-compose restart api
docker-compose restart celery

# Run Django management commands
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py createsuperuser
docker-compose exec api python manage.py collectstatic

# Access PostgreSQL
docker-compose exec db psql -U postgres -d roxas

# Test transaction flow
docker-compose exec api python test_transaction_flow.py
```

### Frontend

```powershell
# Install dependencies
bun install

# Development server
bun dev

# Production build
bun build

# Type checking
bun run typecheck

# Linting
bun run lint
```

---

## 🌐 Environment Configuration

### Backend (`.env`)
Located at: `D:\Website\roxas\backend\.env`

**Critical Variables:**
```env
# Django
SECRET_KEY=django-insecure-njykn0k2q=ao-_r+pta_+s&=1mt0zmhtszc@lblvgwywghad+s
DEBUG=true
ALLOWED_HOSTS=data.roxasgamestore.com,localhost,127.0.0.1

# Database
SQL_DATABASE=roxas
SQL_USER=postgres
SQL_PASSWORD=ciptacode
SQL_HOST=db

# Midtrans (Sandbox)
MIDTRANS_SERVER_KEY=Mid-server-SemNJr2BsvmZzcggd8w8On5q
MIDTRANS_CLIENT_KEY=Mid-client-yh_VLX_WjEf3MgK1
MIDTRANS_IS_PRODUCTION=false

# Digiflazz (Development)
DIGIFLAZZ_USERNAME=julexigNJYXg
DIGIFLAZZ_API_KEY=dev-820e6660-b318-11f0-b8dc-9d5ce5559de6
DIGIFLAZZ_WEBHOOK_SECRET=ciptacode
DIGIFLAZZ_IS_PRODUCTION=false
```

### Frontend (`.env`)
Located at: `D:\Website\roxas\frontend\.env`

**Critical Variables:**
```env
# Django Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=418397920538-0ao232d7d26t3bi5sdoe1tf6ea0pmvhb.apps.googleusercontent.com

# Database
DATABASE_URL=postgresql://postgres:ciptacode@localhost:5432/roxas
```

---

## 🔄 Transaction Flow Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ACCOUNT VALIDATION (Mobile Legends)                     │
├─────────────────────────────────────────────────────────────┤
│ Frontend → POST /api/v1/product-items/validate-ml-id/      │
│ Backend → Digiflazz MLCU (testing=true)                    │
│ Response → Account name                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. COUPON VALIDATION (Optional)                            │
├─────────────────────────────────────────────────────────────┤
│ Frontend → POST /api/v1/coupons/validate/                  │
│ Backend → Check code, usage limits, expiration             │
│ Response → Discount amount                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ORDER CREATION & PAYMENT                                │
├─────────────────────────────────────────────────────────────┤
│ Frontend → POST /api/v1/orders/                            │
│ Backend → Create Order + Payment records                    │
│ Backend → Midtrans charge (QRIS/VA/E-Wallet)               │
│ Response → QR code / VA number / Deeplink                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PAYMENT CONFIRMATION                                     │
├─────────────────────────────────────────────────────────────┤
│ User → Pay via Midtrans simulator/app                       │
│ Midtrans → POST /api/v1/webhooks/midtrans/                 │
│ Backend → Update Payment status: SETTLED                    │
│ Backend → Update Order status: PAID                         │
│ Backend → Trigger Celery task: process_order_topup         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. FULFILLMENT PROCESSING                                   │
├─────────────────────────────────────────────────────────────┤
│ Celery → Digiflazz create_transaction (testing=false)      │
│ Celery → Create DigiflazzTransaction record                │
│ Digiflazz → Process top-up to game                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. COMPLETION                                               │
├─────────────────────────────────────────────────────────────┤
│ Digiflazz → POST /api/v1/webhooks/digiflazz/               │
│ Backend → Update Order status: COMPLETED                    │
│ Backend → Save serial number (SN)                           │
│ User → Receives top-up in game                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Containers won't start

```powershell
# Check Docker is running
docker info

# Remove old containers and volumes
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database connection error

```powershell
# Check database is healthy
docker-compose ps

# Check logs
docker-compose logs db

# Recreate database
docker-compose down -v
docker-compose up -d db
docker-compose exec api python manage.py migrate
```

### Issue: Frontend can't connect to backend

**Check:**
1. Backend is running: http://localhost:8000
2. Frontend `.env` has: `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Django CORS settings allow frontend origin
4. Check browser console for CORS errors

```powershell
# Restart both services
docker-compose restart api
cd frontend && bun dev
```

### Issue: Celery tasks not processing

```powershell
# Check Celery worker is running
docker-compose logs celery

# Restart Celery
docker-compose restart celery

# Manually trigger task (Django shell)
docker-compose exec api python manage.py shell
>>> from main.tasks import process_order_topup
>>> from main.models import Order
>>> order = Order.objects.filter(status='PAID').first()
>>> process_order_topup.delay(str(order.id))
```

### Issue: Midtrans payment fails

**Sandbox Testing:**
- Use Midtrans simulator: https://simulator.sandbox.midtrans.com/
- For QRIS: Scan with any e-wallet in sandbox mode
- For VA: Use test VA numbers from Midtrans docs

### Issue: Digiflazz validation fails

**Common causes:**
1. Rate limit exceeded (wait 1 minute)
2. Invalid credentials (check `.env`)
3. Network issue (check Digiflazz status)

```powershell
# Test Digiflazz connection
docker-compose exec api python test_transaction_flow.py
```

---

## 📊 Admin Panel

Access Django admin at: http://localhost:8000/admin

**Create superuser:**
```powershell
docker-compose exec api python manage.py createsuperuser
```

**Manage:**
- Orders & Payments
- Products & Coupons
- Users & Permissions
- Payment Methods

---

## 🔐 Security Notes

**Current Setup (Development):**
- Using sandbox/development API keys
- Debug mode enabled
- HTTPS not required
- CORS allows localhost

**Before Production:**
1. Set `DEBUG=false`
2. Use production API keys
3. Configure proper `SECRET_KEY`
4. Enable HTTPS
5. Update `ALLOWED_HOSTS`
6. Configure proper CORS origins
7. Set up SSL certificates
8. Use production database
9. Configure backup system
10. Set up monitoring & logging

---

## 📚 Additional Resources

- **Transaction Flow Setup**: [TRANSACTION_FLOW_SETUP.md](TRANSACTION_FLOW_SETUP.md)
- **Midtrans Docs**: https://docs.midtrans.com/
- **Digiflazz Docs**: https://developer.digiflazz.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **Next.js**: https://nextjs.org/docs

---

## ✅ Pre-Flight Checklist

Before testing the complete flow, verify:

- [ ] Docker containers running: `docker-compose ps`
- [ ] Database healthy: `docker-compose logs db`
- [ ] Backend accessible: http://localhost:8000
- [ ] Frontend running: http://localhost:3000  
- [ ] Celery worker active: `docker-compose logs celery`
- [ ] Environment variables set: Check `.env` files
- [ ] Test script passes: `docker-compose exec api python test_transaction_flow.py`

**Status: ALL READY ✅**

---

**Happy Testing! 🎮**

If you encounter any issues, check the logs first:
```powershell
docker-compose logs -f --tail=100
```
