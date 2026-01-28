# Roxas Game Store - Backend

Django REST API backend for game top-up store with Midtrans payment integration and Digiflazz fulfillment.

**Production Domain**: `data.roxasgamestore.com`

---

## 🚀 Quick Start

### Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Setup environment:**
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Seed initial data:**
   ```bash
   python manage.py seed_data
   ```
   Creates: Admin user, 12 payment methods, 6 coupons

5. **Start development server with ngrok:**
   ```bash
   # Windows
   .\start-dev-with-ngrok.ps1
   
   # Linux/macOS
   ./start-dev-with-ngrok.sh
   ```

### Docker Quickstart

1. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

2. **Update `.env` with your settings**

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Create superuser:**
   ```bash
   docker-compose exec api python manage.py createsuperuser
   ```

5. **Seed data:**
   ```bash
   docker-compose exec api python manage.py seed_data
   ```

**Services included:**
- ✅ API server (Django)
- ✅ PostgreSQL database  
- ✅ Redis (for Celery)
- ✅ Celery worker (async tasks)
- ✅ Celery beat (scheduled tasks)

---

## 📦 Features

### Payment Gateway
- ✅ **Midtrans Core API** - Custom payment flow
- ✅ QRIS, E-Wallets (GoPay, ShopeePay), Bank VA, Credit Card
- ✅ Automatic fee calculation
- ✅ Webhook notifications (SHA512 validation)

### Product Fulfillment  
- ✅ **Digiflazz** - Game top-up automation
- ✅ Product catalog sync with Celery
- ✅ Webhook notifications (HMAC SHA1 validation)
- ✅ Retry logic with exponential backoff

---

## 📚 Documentation

- **Integration Guide**: [main/integrations/README.md](main/integrations/README.md)
- **Midtrans Core API**: [main/integrations/MIDTRANS_CORE_API.md](main/integrations/MIDTRANS_CORE_API.md)
- **Quick Start**: [main/integrations/QUICKSTART.md](main/integrations/QUICKSTART.md)
- **Ngrok Setup**: [NGROK_SETUP.md](NGROK_SETUP.md)
- **Deployment**: [../DEPLOYMENT.md](../DEPLOYMENT.md)

---

## 🌐 Webhook URLs

### Development (Ngrok)
```
https://YOUR_NGROK_URL.ngrok.io/api/main/webhooks/midtrans/
https://YOUR_NGROK_URL.ngrok.io/api/main/webhooks/digiflazz/
```

### Production
```
https://data.roxasgamestore.com/api/main/webhooks/midtrans/
https://data.roxasgamestore.com/api/main/webhooks/digiflazz/
```

---

## 🔧 Environment Variables

Required in `.env`:

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,.ngrok.io

# Midtrans Core API
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_PRODUCTION=False

# Digiflazz
DIGIFLAZZ_USERNAME=your-username
DIGIFLAZZ_API_KEY=your-api-key
DIGIFLAZZ_WEBHOOK_SECRET=your-webhook-secret
```

See `env.example` for complete list.

---

**Version**: 1.0  
**Last Updated**: January 28, 2026

