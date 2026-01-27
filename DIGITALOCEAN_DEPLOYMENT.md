# DigitalOcean Deployment Guide

Complete guide to deploy Roxas application on DigitalOcean with Docker, SSL, and production setup.

## 📋 Prerequisites

- DigitalOcean account
- Domain name (e.g., example.com)
- SSH key pair
- GitHub account (for code repository)

## 🚀 Step-by-Step Deployment

### Step 1: Create DigitalOcean Droplet

1. **Login to DigitalOcean** and create a new Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** 
     - Minimum: Basic - $12/month (2GB RAM, 1 vCPU, 50GB SSD)
     - Recommended: Basic - $24/month (4GB RAM, 2 vCPU, 80GB SSD)
   - **Region:** Choose closest to your target users
   - **Authentication:** SSH Key (add your public key)
   - **Hostname:** roxas-production

2. **Note your Droplet's IP address** (e.g., 192.168.1.100)

### Step 2: Configure DNS

Point your domain to the Droplet:

**In your DNS provider (Cloudflare, Namecheap, etc.):**

```
Type    Name    Value              TTL
A       @       YOUR_DROPLET_IP    Auto
A       www     YOUR_DROPLET_IP    Auto
```

**Verify DNS propagation:**
```bash
# On your local machine
nslookup yourdomain.com
```

Wait 5-30 minutes for DNS propagation.

### Step 3: Initial Server Setup

**SSH into your server:**
```bash
ssh root@YOUR_DROPLET_IP
```

**Run initialization:**
```bash
# Download initialization script
curl -fsSL https://raw.githubusercontent.com/yourusername/roxas/main/deploy-prod.sh -o deploy-prod.sh

# Make executable
chmod +x deploy-prod.sh

# Initialize server (installs Docker, sets up firewall, creates directories)
sudo ./deploy-prod.sh init
```

This will:
- Update system packages
- Install Docker and Docker Compose
- Configure UFW firewall (ports 22, 80, 443)
- Create application directories
- Setup fail2ban for security

### Step 4: Deploy Application Code

**Option A: Clone from GitHub (Recommended)**
```bash
# Clone to home directory (or any preferred location)
cd ~
git clone https://github.com/yourusername/roxas.git
cd roxas
```

**Option B: Upload via SCP**
```bash
# On your local machine - upload to home directory
scp -r /path/to/roxas root@YOUR_DROPLET_IP:~/
```

> **Note:** All commands in this guide assume you're running them from the project root directory (`~/roxas` or wherever you cloned it).

### Step 5: Configure Environment Variables

**Create production environment file:**
```bash
# From project root directory
nano .env.production
```

**Add your production configuration:**
```bash
# Database
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD_HERE@db:5432/roxas"

# Redis
REDIS_URL="redis://:REDIS_PASSWORD_HERE@redis:6379"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Mailgun)
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="mg.yourdomain.com"
MAILGUN_FROM="noreply@yourdomain.com"

# Payment Gateways
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
MIDTRANS_IS_PRODUCTION="true"

DIGIFLAZZ_USERNAME="your-digiflazz-username"
DIGIFLAZZ_API_KEY="your-digiflazz-api-key"
DIGIFLAZZ_API_URL="https://api.digiflazz.com/v1"

# Node Environment
NODE_ENV="production"
```

**Generate secure secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24
```

### Step 6: Deploy Application

**Run full deployment:**
```bash
# From project root directory
chmod +x deploy-prod.sh update-prod.sh

# Deploy (builds images, starts services, runs migrations)
sudo DOMAIN=roxasgamestore.com EMAIL=admin@roxasgamestore.com ./deploy-prod.sh deploy
```

This will:
- Build Docker images
- Start all services (app, database, redis, nginx, etc.)
- Run database migrations
- Generate Prisma client

**Verify services are running:**
```bash
docker compose -f docker-compose.prod.yml ps
```

You should see all services "Up" and healthy.

### Step 7: Setup SSL Certificates

**Request Let's Encrypt certificates:**
```bash
sudo DOMAIN=roxasgamestore.com EMAIL=admin@roxasgamestore.com ./deploy-prod.sh ssl
```

This will:
- Stop nginx temporarily
- Request SSL certificates from Let's Encrypt
- Configure auto-renewal (runs daily at 3 AM)
- Restart nginx with HTTPS enabled

**Verify SSL is working:**
```bash
curl -I https://yourdomain.com
```

Your site should now be accessible at `https://yourdomain.com` 🎉

### Step 8: Initial Setup & Testing

**Seed initial data (if needed):**
```bash
docker compose -f docker-compose.prod.yml exec app bunx prisma db seed
```

**Create admin user:**
Visit `https://yourdomain.com/admin/login` and register first admin account.

**Test functionality:**
- [ ] Homepage loads
- [ ] User registration works
- [ ] Email sending works
- [ ] Payment integration works
- [ ] Admin panel accessible

## 🔄 Updating Your Application

### For Code Changes Only (Fast)

When you only changed code files (no dependencies, no schema changes):

```bash
# From project root directory
git pull origin main

# Quick update (no rebuild)
./update-prod.sh
```

This script:
- Creates automatic database backup
- Pulls latest code
- Detects if package.json or schema changed
- Rebuilds only if necessary
- Restarts services with minimal downtime

### For Major Changes (Full Rebuild)

When you changed dependencies, Dockerfiles, or need clean slate:

```bash
# From project root directory
git pull origin main

# Full deployment
sudo DOMAIN=yourdomain.com ./deploy-prod.sh deploy
```

## 📊 Monitoring & Maintenance

### View Logs

**All services:**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Specific service:**
```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f db
```

**Last 100 lines:**
```bash
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

### Service Management

**Restart services:**
```bash
./deploy-prod.sh restart
```

**Stop all services:**
```bash
docker compose -f docker-compose.prod.yml down
```

**Start services:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

**Check service health:**
```bash
docker compose -f docker-compose.prod.yml ps
docker stats  # Resource usage
```

### Database Backup

**Manual backup:**
```bash
./deploy-prod.sh backup
```

Backups stored in `./backups/` directory (automatically keeps last 7)

**Automatic backups (setup cron):**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM (replace ~/roxas with your project path)
0 2 * * * cd ~/roxas && ./deploy-prod.sh backup
```

**Restore from backup:**
```bash
# Stop app
docker compose -f docker-compose.prod.yml stop app

# Restore database
gunzip < backups/postgres_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U postgres roxas

# Restart app
docker compose -f docker-compose.prod.yml start app
```

## 🔒 Security Checklist

- [x] Firewall configured (UFW) - only ports 22, 80, 443 open
- [x] SSL certificates installed (HTTPS)
- [x] Strong database passwords
- [x] Redis password protected
- [x] Fail2ban installed (blocks brute force)
- [ ] Regular backups scheduled
- [ ] Monitoring setup (optional: use DigitalOcean Monitoring)
- [ ] Regular system updates

**Keep system updated:**
```bash
apt update && apt upgrade -y
```

## 📈 Scaling & Performance

### Vertical Scaling (Resize Droplet)

1. Go to DigitalOcean dashboard
2. Select your Droplet → Resize
3. Choose larger plan
4. Restart services after resize

### Horizontal Scaling (Multiple Workers)

Edit `docker-compose.prod.yml`:

```yaml
email-worker:
  deploy:
    replicas: 3  # Increase from 2 to 3

app:
  deploy:
    replicas: 2  # Add multiple app instances
```

Then redeploy:
```bash
docker compose -f docker-compose.prod.yml up -d --scale app=2
```

### Database Performance

**Enable connection pooling** (already configured in Prisma)

**Monitor slow queries:**
```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres roxas -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory
free -h

# Restart specific service
docker compose -f docker-compose.prod.yml restart app
```

### SSL Certificate Issues

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# Manually renew
docker compose -f docker-compose.prod.yml run --rm certbot renew

# Test renewal
docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run
```

### Database Connection Issues

```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Access database directly
docker compose -f docker-compose.prod.yml exec db psql -U postgres roxas

# Check connections
docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Out of Disk Space

```bash
# Clean Docker images/containers
docker system prune -a

# Clean old logs
docker compose -f docker-compose.prod.yml logs --tail=0 app > /dev/null

# Check volume sizes
docker system df
```

## 📞 Support & Resources

- **DigitalOcean Docs:** https://docs.digitalocean.com/
- **Docker Docs:** https://docs.docker.com/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Next.js Deployment:** https://nextjs.org/docs/deployment

## 🎯 Quick Reference

```bash
# All commands run from project root directory (e.g., ~/roxas)

# Initial deployment
sudo ./deploy-prod.sh init
sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com ./deploy-prod.sh deploy
sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com ./deploy-prod.sh ssl

# Regular updates
./update-prod.sh

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Backup
./deploy-prod.sh backup

# Restart
./deploy-prod.sh restart
```

---

**✨ Your application is now live!**

Visit: `https://yourdomain.com`
Admin: `https://yourdomain.com/admin`
