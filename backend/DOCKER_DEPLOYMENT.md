# Roxas Game Store - Backend Setup & Deployment Guide

## 📋 Table of Contents
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Docker Services](#docker-services)
- [Environment Configuration](#environment-configuration)

## 🔧 Environment Variables

### Required Environment Variables

#### Django Core
```bash
SECRET_KEY=                    # Django secret key (generate with get_random_secret_key())
DEBUG=false                    # true for dev, false for production
ALLOWED_HOSTS=                 # Comma-separated list of allowed domains
CSRF_TRUSTED_ORIGINS=          # Comma-separated HTTPS origins for CSRF
```

#### Database (PostgreSQL)
```bash
SQL_DATABASE=roxas_gamestore   # Database name
SQL_USER=roxas_user            # Database username
SQL_PASSWORD=                  # Database password (strong password!)
SQL_HOST=db                    # db (Docker) or localhost
SQL_PORT=5432                  # PostgreSQL port
DB_CONN_MAX_AGE=300           # Connection pool timeout
```

#### Redis & Celery
```bash
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
REDIS_URL=redis://redis:6379/1
```

#### Email (Mailgun)
```bash
MAILGUN_API_KEY=              # From Mailgun dashboard
MAILGUN_DOMAIN=               # Your verified domain
DEFAULT_FROM_EMAIL=           # noreply@yourdomain.com
FRONTEND_URL=                 # https://yourdomain.com
```

#### Payment Gateway (Midtrans)
```bash
MIDTRANS_SERVER_KEY=          # Server key from dashboard.midtrans.com
MIDTRANS_CLIENT_KEY=          # Client key from dashboard
MIDTRANS_ENVIRONMENT=production  # 'sandbox' or 'production'
MIDTRANS_API_URL=https://api.midtrans.com/v2  # API endpoint
```

#### Game Top-Up (Digiflazz)
```bash
DIGIFLAZZ_USERNAME=           # Username from member.digiflazz.com
DIGIFLAZZ_API_KEY=            # Production API key
DIGIFLAZZ_ENVIRONMENT=production  # 'sandbox' or 'production'
DIGIFLAZZ_API_URL=https://api.digiflazz.com/v1
DIGIFLAZZ_WEBHOOK_URL=        # Your webhook callback URL
```

#### JWT Tokens
```bash
ACCESS_TOKEN_LIFETIME_MINUTES=15  # Access token expiry (minutes)
REFRESH_TOKEN_LIFETIME_DAYS=7     # Refresh token expiry (days)
```

#### CORS
```bash
CORS_ALLOWED_ORIGINS=         # https://yourdomain.com (comma-separated)
CORS_ALLOW_CREDENTIALS=true
```

#### Security (Production Only)
```bash
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
```

## 🚀 Local Development

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ (if running without Docker)
- PostgreSQL 15+ (if running without Docker)
- Redis 7+ (if running without Docker)

### Quick Start with Docker

1. **Copy environment file:**
```bash
cp env.example .env
```

2. **Update .env with your values:**
```bash
# Edit .env and set at minimum:
SECRET_KEY=your-random-secret-key
SQL_DATABASE=roxas_gamestore
SQL_USER=roxas_user
SQL_PASSWORD=your-password
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Run migrations:**
```bash
docker-compose exec api python manage.py migrate
```

5. **Create superuser:**
```bash
docker-compose exec api python manage.py createsuperuser
```

6. **Access the application:**
- API: http://localhost:8000
- Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/
- Health Check: http://localhost:8000/health/

### Running Without Docker

1. **Create virtual environment:**
```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Setup PostgreSQL database:**
```sql
CREATE DATABASE roxas_gamestore;
CREATE USER roxas_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE roxas_gamestore TO roxas_user;
```

4. **Run migrations:**
```bash
python manage.py migrate
python manage.py createsuperuser
```

5. **Start Redis:**
```bash
redis-server
```

6. **Start Celery worker (separate terminal):**
```bash
celery -A backend worker --loglevel=info
```

7. **Start Celery beat (separate terminal):**
```bash
celery -A backend beat --loglevel=info
```

8. **Run development server:**
```bash
python manage.py runserver
```

## 🌐 Production Deployment

### Docker Compose Production Setup

1. **Copy production environment file:**
```bash
cp env.prod.example .env
```

2. **Update .env with production values:**
- Set strong `SECRET_KEY`
- Set `DEBUG=0`
- Configure `ALLOWED_HOSTS` with your domain
- Set `CSRF_TRUSTED_ORIGINS` with https:// URLs
- Configure Midtrans production keys
- Configure Digiflazz production keys
- Set Mailgun credentials
- Enable all security settings

3. **Create nginx SSL directory (if using HTTPS):**
```bash
mkdir -p nginx/ssl/yourdomain.com
# Copy your SSL certificates to nginx/ssl/yourdomain.com/
# - fullchain.pem
# - privkey.pem
# - chain.pem
```

4. **Update nginx configuration:**
```bash
# Edit nginx/data.roxasgamestore.com.conf and replace:
# - server_name: data.roxasgamestore.com → yourdomain.com
# - SSL paths: data.roxasgamestore.com → yourdomain.com
```

5. **Start production services:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

6. **Run migrations:**
```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py migrate
```

7. **Create superuser:**
```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

8. **Collect static files:**
```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py collectstatic --noinput
```

### Initial Deployment Checklist

- [ ] Set strong SECRET_KEY (use: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
- [ ] Set DEBUG=0
- [ ] Configure ALLOWED_HOSTS with actual domain
- [ ] Configure CSRF_TRUSTED_ORIGINS with https:// URLs
- [ ] Set up Midtrans production account and keys
- [ ] Set up Digiflazz production account and keys
- [ ] Configure Mailgun domain and API key
- [ ] Set up SSL certificates
- [ ] Configure nginx server_name
- [ ] Enable all security settings (HSTS, secure cookies, etc.)
- [ ] Run migrations
- [ ] Create superuser
- [ ] Test health endpoint
- [ ] Test payment integration (sandbox first!)
- [ ] Set up monitoring/logging

## 🐳 Docker Services

### Development (docker-compose.yml)

| Service | Port | Description |
|---------|------|-------------|
| api | 8000 | Django API (runserver) |
| db | 5432 | PostgreSQL 15 |
| redis | 6379 | Redis 7 |
| celery | - | Celery worker |
| celery-beat | - | Celery scheduler |

### Production (docker-compose.prod.yml)

| Service | Port | Resource Limits | Description |
|---------|------|-----------------|-------------|
| nginx | 80, 443 | 50MB | Nginx reverse proxy |
| api | - | 200MB | Gunicorn (1 worker, 2 threads) |
| db | - | 200MB | PostgreSQL 15 |
| redis | - | 100MB | Redis 7 (80MB max memory) |
| celery | - | 200MB | Celery worker (1 concurrency) |
| celery-beat | - | 100MB | Celery beat scheduler |

**Optimized for:** 2GB RAM server

### Service Health Checks

All services have health checks configured:
- **API**: `GET /health/` - Checks DB and Redis
- **DB**: `pg_isready` command
- **Redis**: `redis-cli ping`
- **Nginx**: Process check
- **Celery**: `celery inspect ping`
- **Celery Beat**: Process check + Python script

## 📁 Media Files Structure

```
media/
├── profile_photos/          # User profile photos
├── category_instructions/   # Category instruction images
├── products/               # Product images
│   └── banners/           # Product banner images
├── product_items/         # Product item icons
└── banners/               # Marketing banners
```

All images are automatically optimized to WebP format on upload (max 1920x1920, quality 85).

## 🔍 Monitoring & Logs

### View logs:
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f celery
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Log files:
- API logs: `./logs/`
- Nginx logs: `./nginx/logs/`

### Health check:
```bash
curl https://yourdomain.com/health/
```

Expected response:
```json
{
  "status": "healthy",
  "database": "ok",
  "cache": "ok"
}
```

## 🛠️ Maintenance Commands

### Backup database:
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U roxas_user roxas_gamestore > backup.sql
```

### Restore database:
```bash
docker-compose -f docker-compose.prod.yml exec -T db psql -U roxas_user roxas_gamestore < backup.sql
```

### View Celery tasks:
```bash
docker-compose -f docker-compose.prod.yml exec celery celery -A backend inspect active
```

### Restart specific service:
```bash
docker-compose -f docker-compose.prod.yml restart api
docker-compose -f docker-compose.prod.yml restart celery
```

### Update code and restart:
```bash
git pull
docker-compose -f docker-compose.prod.yml build api celery
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec api python manage.py migrate
```

## 🔐 Security Recommendations

1. **Use strong passwords** for database, superuser, and API keys
2. **Enable all security headers** in production
3. **Use HTTPS only** in production
4. **Keep SECRET_KEY secret** - never commit to git
5. **Regularly update dependencies**
6. **Monitor logs** for suspicious activity
7. **Enable firewall** - only ports 80, 443, and SSH
8. **Use rate limiting** - configured in nginx
9. **Regular backups** of database and media files
10. **Monitor resource usage** - especially for 2GB RAM limit

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Midtrans Documentation](https://docs.midtrans.com/)
- [Digiflazz Documentation](https://digiflazz.com/dokumentasi-api)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
