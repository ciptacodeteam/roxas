# Deployment Guide - Roxas to DigitalOcean

This guide will help you deploy Roxas to a DigitalOcean Droplet with SSL certificates.

## Prerequisites

- DigitalOcean account
- Domain name pointed to your server
- GitHub repository with your code

## Option 1: Manual Deployment

### Step 1: Create DigitalOcean Droplet

1. Create a new droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** Basic - 2GB RAM / 1 CPU ($12/month minimum recommended)
   - **Region:** Choose closest to your users
   - **SSH Key:** Add your SSH key

2. Note your droplet's IP address

### Step 2: Point Your Domain

In your domain registrar (Cloudflare, Namecheap, etc.):

```
A Record:  @     -> YOUR_DROPLET_IP
A Record:  www   -> YOUR_DROPLET_IP
```

Wait for DNS propagation (can take up to 24 hours, usually 5-10 minutes).

### Step 3: Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_DROPLET_IP
```

Run the initialization script:

```bash
# Clone your repository
cd /var/www
git clone https://github.com/yourusername/roxas.git
cd roxas

# Make deploy script executable
chmod +x deploy.sh

# Initialize server (installs Docker, configures firewall)
./deploy.sh init
```

### Step 4: Configure Environment

Edit the deployment script with your domain:

```bash
nano deploy.sh
```

Change:
- `DOMAIN="yourdomain.com"` to your actual domain
- `EMAIL="your-email@example.com"` to your email

Create production environment file:

```bash
cp .env.production.example .env
nano .env
```

Fill in all required values:
- Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Set strong `DB_PASSWORD`
- Add your Digiflazz, Midtrans credentials

### Step 5: Setup SSL Certificates

```bash
./deploy.sh ssl
```

This will:
- Create SSL certificates via Let's Encrypt
- Update nginx configuration
- Configure automatic renewal

### Step 6: Deploy Application

```bash
./deploy.sh deploy
```

This will:
- Build Docker images
- Start all services (app, database, nginx, scheduler)
- Run database migrations
- Start the scheduler worker

### Step 7: Verify Deployment

Visit your domain:
```
https://yourdomain.com
```

Check services are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

View logs:
```bash
./deploy.sh logs app         # Main app logs
./deploy.sh logs scheduler   # Scheduler logs
./deploy.sh logs nginx       # Nginx logs
```

## Option 2: Automatic Deployment (CI/CD)

### Step 1: Setup GitHub Secrets

In your GitHub repository, go to Settings → Secrets → Actions, add:

- `SSH_PRIVATE_KEY`: Your private SSH key
- `SERVER_IP`: Your droplet IP address
- `SERVER_USER`: `root` (or your user)

### Step 2: Update Deploy Workflow

Edit `.github/workflows/deploy.yml`:

Replace `yourdomain.com` with your actual domain.

### Step 3: Deploy

Push to main branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will automatically deploy!

## Scheduler Worker

The scheduler runs these background jobs:

- **Price Sync:** Every 30 minutes
- **Health Check:** Every 5 minutes
- **API Log Cleanup:** Daily at 2:00 AM (keeps 30 days)
- **Session Cleanup:** Daily at 3:00 AM
- **Order Cleanup:** Daily at 4:00 AM (deletes pending orders older than 24h)

### Customize Schedule

Edit `scheduler/index.ts` and modify cron expressions:

```typescript
// Run every hour instead of 30 minutes
cron.schedule("0 * * * *", async () => { ... });
```

Cron format: `minute hour day month weekday`

## Maintenance Commands

### Backup Database

```bash
./deploy.sh backup
```

Backups are stored in `backups/` directory (keeps last 7).

### Restore Database

```bash
./deploy.sh restore backups/db_backup_20260127_120000.sql
```

### View Logs

```bash
./deploy.sh logs app         # App logs
./deploy.sh logs scheduler   # Scheduler logs
./deploy.sh logs db          # Database logs
./deploy.sh logs nginx       # Nginx logs
```

### Update Application

```bash
cd /var/www/roxas
git pull origin main
./deploy.sh deploy
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml restart scheduler
docker compose -f docker-compose.prod.yml restart nginx
```

### Check Service Status

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## SSL Certificate Renewal

Certificates auto-renew via certbot container. To manually renew:

```bash
docker compose -f docker-compose.prod.yml exec certbot certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

## Troubleshooting

### App won't start

Check logs:
```bash
docker compose -f docker-compose.prod.yml logs app
```

Common issues:
- Database not ready: Wait 30 seconds and restart
- Environment variables missing: Check `.env` file
- Port already in use: Stop conflicting service

### SSL certificate errors

1. Ensure DNS is propagated: `dig yourdomain.com`
2. Check certbot logs: `docker compose -f docker-compose.prod.yml logs certbot`
3. Verify nginx config: `docker compose -f docker-compose.prod.yml exec nginx nginx -t`

### Database connection issues

```bash
# Check database is running
docker compose -f docker-compose.prod.yml ps db

# Test connection
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d roxas
```

### Scheduler not running jobs

```bash
# Check scheduler logs
docker compose -f docker-compose.prod.yml logs scheduler

# Restart scheduler
docker compose -f docker-compose.prod.yml restart scheduler
```

## Monitoring

### Check disk space

```bash
df -h
docker system df
```

### Clean up Docker

```bash
docker system prune -a --volumes
```

### Monitor resources

```bash
htop
docker stats
```

## Scaling

### Increase server resources

In DigitalOcean:
1. Power off droplet
2. Resize to larger plan
3. Power on
4. No config changes needed

### Add Redis caching (optional)

Add to `docker-compose.prod.yml`:

```yaml
  redis:
    image: redis:alpine
    container_name: roxas-redis-prod
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - roxas-network
```

## Security Checklist

- ✅ SSL certificates enabled
- ✅ Firewall configured (UFW)
- ✅ Rate limiting enabled (nginx)
- ✅ Strong database password
- ✅ NEXTAUTH_SECRET generated
- ✅ Regular backups scheduled
- ✅ Automatic security updates
- ✅ Non-root user for deployment (recommended)

## Support

If you encounter issues:
1. Check logs: `./deploy.sh logs`
2. Review this guide
3. Check GitHub issues
4. Contact support

## Performance Tips

1. **Enable caching:** Add Redis for session/API caching
2. **CDN:** Use Cloudflare in front of your domain
3. **Database:** Upgrade to managed PostgreSQL for production
4. **Monitoring:** Add Sentry for error tracking
5. **Backups:** Automate daily backups to S3/Spaces
