# Complete Deployment Guide
## Travel Marketplace Backend - Digital Ocean (1 vCPU, 2GB RAM)

This guide will walk you through deploying the Travel Marketplace Backend to a Digital Ocean droplet step by step.

---

## 📋 Prerequisites

- A Digital Ocean droplet with Ubuntu 22.04+ (1 vCPU, 2GB RAM)
- SSH access to your server
- Domain name configured (e.g., `data.roxasgamestore.com`)
- DNS A record pointing to your server IP

---

## 🚀 Step-by-Step Deployment

### Step 1: Initial Server Setup (One-Time)

**On your server, run:**

```bash
# Clone your repository (if not already done)
cd ~
git clone https://github.com/your-username/travel-marketplace-backend.git
cd travel-marketplace-backend

# Run the setup script
sudo ./deploy/setup.sh
```

**What this does:**
- Updates system packages
- Installs Docker and Docker Compose
- Optimizes system for 2GB RAM
- Creates 2GB swap file
- Configures firewall (UFW)
- Sets up necessary directories

**Expected time:** 5-10 minutes

---

### Step 2: Configure Environment Variables

**Create your `.env` file:**

```bash
cd ~/travel-marketplace-backend
cp env.prod.example .env
nano .env
```

**Required variables to set:**

```bash
# Django Settings
SECRET_KEY=your-super-secret-key-here  # Generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
DEBUG=0
ALLOWED_HOSTS=data.roxasgamestore.com,your-server-ip
CSRF_TRUSTED_ORIGINS=https://data.roxasgamestore.com

# Database
SQL_DATABASE=travel_marketplace
SQL_USER=travel_user
SQL_PASSWORD=your-strong-database-password
DATABASE_URL=postgresql://travel_user:your-strong-database-password@db:5432/travel_marketplace

# Security (set after SSL setup)
SECURE_SSL_REDIRECT=0  # Change to 1 after SSL setup
SESSION_COOKIE_SECURE=0  # Change to 1 after SSL setup
CSRF_COOKIE_SECURE=0  # Change to 1 after SSL setup

# JWT Settings
ACCESS_TOKEN_LIFETIME_MINUTES=15
REFRESH_TOKEN_LIFETIME_DAYS=7

# Email (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=1
DEFAULT_FROM_EMAIL=noreply@goholiday.id
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

### Step 3: Deploy the Application

**Run the deployment script:**

```bash
sudo ./deploy/deploy.sh
```

**What this does:**
- Creates necessary directories
- Pulls Docker images
- Builds application images
- Starts all services (API, Database, Redis, Celery, Nginx)
- Runs database migrations
- Collects static files

**Expected time:** 5-10 minutes

**After deployment, check status:**

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should show "Up" and "healthy".

---

### Step 4: Create Superuser (Optional)

**Create an admin user:**

```bash
docker compose -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

Follow the prompts to create your admin account.

---

### Step 5: Setup SSL Certificate

**⚠️ Important:** Make sure your DNS A record is pointing to your server IP before running this!

**Run the SSL setup:**

```bash
sudo ./deploy/ssl-setup.sh
```

**What this does:**
- Checks DNS configuration
- Requests a Let's Encrypt certificate via HTTP-01 webroot (nginx stays running)
- Copies certificates into `nginx/ssl` and reloads nginx
- Installs a certbot deploy hook plus twice-daily cron auto-renewal

Re-run this script if the certificate has expired or auto-renewal was broken.

**Expected time:** 2-3 minutes

**After SSL setup, update your `.env` file:**

```bash
nano .env
```

Change these values:
```bash
SECURE_SSL_REDIRECT=1
SESSION_COOKIE_SECURE=1
CSRF_COOKIE_SECURE=1
```

**Restart the API to apply changes:**

```bash
docker compose -f docker-compose.prod.yml restart api
```

---

### Step 6: Verify Everything Works

**Test your API:**

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://data.roxasgamestore.com/health/

# Test HTTPS
curl https://data.roxasgamestore.com/health/
```

**Check service logs:**

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## 🔄 Updating the Application

When you make code changes, use the update script:

```bash
sudo ./deploy/update.sh
```

**What this does:**
- Pulls latest code (if using git)
- Stops services
- Rebuilds images
- Restarts services
- Runs migrations
- Collects static files

**⚠️ Note:** This causes ~30-60 seconds of downtime.

---

## 📊 Monitoring & Maintenance

### Check Service Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f db
```

### Check Resource Usage

```bash
# Docker container stats
docker stats

# System resources
free -h
df -h
htop
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🛠️ Troubleshooting

### Services Won't Start

1. **Check logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs
   ```

2. **Check .env file:**
   ```bash
   cat .env
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Check Docker:**
   ```bash
   docker ps
   docker system df
   ```

### Port Already in Use (Port 80/443 Conflict)

If you see an error like `failed to bind host port 0.0.0.0:80/tcp: address already in use`:

1. **Identify what's using the port:**
   ```bash
   # Using lsof (if available)
   sudo lsof -i:80
   sudo lsof -i:443
   
   # Using netstat (alternative)
   sudo netstat -tlnp | grep ':80'
   sudo netstat -tlnp | grep ':443'
   
   # Using ss (alternative)
   sudo ss -tlnp | grep ':80'
   sudo ss -tlnp | grep ':443'
   ```

2. **Common solutions:**

   **Stop Apache (if running):**
   ```bash
   sudo systemctl stop apache2
   sudo systemctl disable apache2  # Prevent auto-start
   ```

   **Stop system Nginx (if running):**
   ```bash
   sudo systemctl stop nginx
   sudo systemctl disable nginx  # Prevent auto-start
   ```

   **Stop other Docker containers using the port:**
   ```bash
   # List all containers
   docker ps -a
   
   # Stop specific container
   docker stop <container-name>
   
   # Or stop all containers
   docker stop $(docker ps -q)
   ```

   **Check for other services:**
   ```bash
   # Check all listening ports
   sudo netstat -tlnp
   
   # Check systemd services
   sudo systemctl list-units --type=service | grep -E 'nginx|apache|httpd'
   ```

3. **After stopping the conflicting service, retry deployment:**
   ```bash
   sudo ./deploy/deploy.sh
   ```

**Note:** The deployment script now automatically checks for port conflicts before starting services and will provide helpful error messages if ports are in use.

### Database Connection Issues

1. **Check database is running:**
   ```bash
   docker compose -f docker-compose.prod.yml ps db
   ```

2. **Check database logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs db
   ```

3. **Verify credentials in .env:**
   ```bash
   grep SQL_ .env
   ```

### SSL Certificate Issues

Certificates expire every 90 days. Auto-renewal uses HTTP-01 webroot (nginx stays up) and a twice-daily cron. Do not use `certbot --standalone` while nginx is bound to port 80.

1. **Check certificate status:**
   ```bash
   sudo certbot certificates
   echo | openssl s_client -connect data.roxasgamestore.com:443 -servername data.roxasgamestore.com 2>/dev/null | openssl x509 -noout -dates
   ```

2. **Issue or repair the certificate (also reinstalls auto-renewal):**
   ```bash
   sudo ./deploy/ssl-setup.sh
   ```

3. **Renew now / test renewal:**
   ```bash
   sudo ./deploy/renew-ssl.sh
   sudo certbot certonly --webroot -w certbot/www -d data.roxasgamestore.com --dry-run
   ```

4. **Check nginx SSL config and renewal logs:**
   ```bash
   docker compose -f docker-compose.prod.yml exec nginx nginx -t
   tail -n 50 /var/log/letsencrypt/roxas-renew.log
   ```

### Out of Memory Issues

If you're running out of memory:

1. **Check memory usage:**
   ```bash
   free -h
   docker stats
   ```

2. **Restart services:**
   ```bash
   docker compose -f docker-compose.prod.yml restart
   ```

3. **Clean up Docker:**
   ```bash
   docker system prune -a
   ```

---

## 📁 File Structure

```
travel-marketplace-backend/
├── deploy/
│   ├── setup.sh          # Initial server setup (one-time)
│   ├── deploy.sh          # Main deployment script
│   ├── update.sh          # Update script for code changes
│   ├── ssl-setup.sh       # SSL certificate setup
│   └── DEPLOYMENT_GUIDE.md # This file
├── nginx/
│   ├── nginx.conf         # Main nginx config
│   ├── data.roxasgamestore.com.conf          # SSL config
│   ├── data.roxasgamestore.com.http-only.conf # HTTP-only config
│   └── ssl/               # SSL certificates (created by ssl-setup.sh)
├── docker-compose.prod.yml # Docker Compose configuration
├── .env                   # Environment variables (create from env.prod.example)
└── ...
```

---

## 🔐 Security Checklist

- [ ] `DEBUG=0` in `.env`
- [ ] Strong `SECRET_KEY` set
- [ ] Strong database password
- [ ] `ALLOWED_HOSTS` includes your domain
- [ ] SSL certificate installed
- [ ] `SECURE_SSL_REDIRECT=1` after SSL setup
- [ ] `SESSION_COOKIE_SECURE=1` after SSL setup
- [ ] `CSRF_COOKIE_SECURE=1` after SSL setup
- [ ] Firewall (UFW) configured
- [ ] SSH key authentication (disable password auth)

---

## 📞 Quick Reference

### Common Commands

```bash
# Deploy
sudo ./deploy/deploy.sh

# Update
sudo ./deploy/update.sh

# Setup SSL
sudo ./deploy/ssl-setup.sh

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Check status
docker compose -f docker-compose.prod.yml ps

# Access API shell
docker compose -f docker-compose.prod.yml exec api python manage.py shell

# Run migrations manually
docker compose -f docker-compose.prod.yml exec api python manage.py migrate

# Collect static files
docker compose -f docker-compose.prod.yml exec api python manage.py collectstatic
```

---

## 🎉 You're Done!

Your Travel Marketplace Backend should now be running on:
- **HTTP:** http://data.roxasgamestore.com (redirects to HTTPS)
- **HTTPS:** https://data.roxasgamestore.com

**Next Steps:**
- Test your API endpoints
- Configure your frontend to use the API
- Set up monitoring (optional)
- Schedule regular backups (optional)

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Digital Ocean Documentation](https://docs.digitalocean.com/)

---

**Need Help?** Check the logs first, then review the troubleshooting section above.

