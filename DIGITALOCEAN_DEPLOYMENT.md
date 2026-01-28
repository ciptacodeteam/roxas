# DigitalOcean Deployment Guide

Complete guide to deploy Roxas on DigitalOcean with Docker.

## Quick Start

```bash
# 1. Create droplet (4GB recommended, 2GB minimum)
# 2. SSH into server
ssh root@your-server-ip

# 3. Clone repository
git clone https://github.com/yourusername/roxas.git
cd roxas

# 4. Initialize server
sudo ./deploy-prod.sh init

# 5. Configure environment
cp env.example .env.production
nano .env.production

# 6. Deploy
sudo DOMAIN=yourdomain.com ./deploy-prod.sh deploy

# 7. Setup SSL
sudo DOMAIN=yourdomain.com ./deploy-prod.sh ssl

# 8. Seed database (optional)
sudo ./deploy-prod.sh seed
```

---

## Prerequisites

- **DigitalOcean Droplet**: 4GB RAM recommended (2GB works with swap)
- **Domain**: Pointed to your droplet IP
- **Email**: For SSL certificate notifications

---

## Detailed Setup

### Step 1: Create Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com)
2. Create Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: 4GB / 2 vCPU ($24/mo) or 2GB with swap
   - **Region**: Closest to your users
   - **Authentication**: SSH keys (recommended)

### Step 2: Point Domain

Add DNS A records:
```
@     A    your-droplet-ip
www   A    your-droplet-ip
```

### Step 3: Connect & Setup

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Clone repo
cd ~
git clone https://github.com/yourusername/roxas.git
cd roxas

# Make script executable
chmod +x deploy-prod.sh

# Initialize (installs Docker, firewall, swap)
sudo ./deploy-prod.sh init
```

### Step 4: Configure Environment

```bash
# Copy template
cp env.example .env.production

# Edit configuration
nano .env.production
```

**Required variables:**
```env
# Database (use defaults for Docker)
DATABASE_URL="postgresql://postgres:password@db:5432/roxas"

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Payment (Midtrans)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=""
MIDTRANS_SERVER_KEY=""
MIDTRANS_MERCHANT_ID=""

# Email (Mailgun)
MAILGUN_API_KEY=""
MAILGUN_DOMAIN=""

# Game API (Digiflazz)
DIGIFLAZZ_USERNAME=""
DIGIFLAZZ_API_KEY=""
```

### Step 5: Deploy

```bash
# Deploy (10-15 minutes on first run)
sudo DOMAIN=yourdomain.com ./deploy-prod.sh deploy
```

### Step 6: Setup SSL

```bash
# Get SSL certificate
sudo DOMAIN=yourdomain.com ./deploy-prod.sh ssl
```

### Step 7: Seed Database (Optional)

```bash
# Add initial data
sudo ./deploy-prod.sh seed
```

---

## Script Commands

| Command | Description |
|---------|-------------|
| `init` | First-time server setup |
| `deploy` | Full build and deploy |
| `ssl` | Setup SSL certificates |
| `update` | Quick update (pull, rebuild, restart) |
| `restart` | Restart all services |
| `reset` | Delete everything (DESTRUCTIVE) |
| `backup` | Create database backup |
| `restore` | Restore from backup |
| `migrate` | Run database migrations |
| `seed` | Run database seed |
| `logs` | View logs |
| `status` | Show service status |
| `shell` | Open container shell |

### Examples

```bash
# View app logs
sudo ./deploy-prod.sh logs app

# View all logs
sudo ./deploy-prod.sh logs

# Check status
sudo ./deploy-prod.sh status

# Create backup
sudo ./deploy-prod.sh backup

# Update after code changes
sudo ./deploy-prod.sh update

# Reset everything
sudo ./deploy-prod.sh reset
```

---

## Common Operations

### Update After Code Changes

```bash
cd ~/roxas
sudo ./deploy-prod.sh update
```

### View Logs

```bash
# All services
sudo ./deploy-prod.sh logs

# Specific service
sudo ./deploy-prod.sh logs app
sudo ./deploy-prod.sh logs nginx
sudo ./deploy-prod.sh logs db
```

### Database Operations

```bash
# Backup
sudo ./deploy-prod.sh backup

# Restore (interactive)
sudo ./deploy-prod.sh restore

# Run migrations
sudo ./deploy-prod.sh migrate

# Seed data
sudo ./deploy-prod.sh seed
```

### Debug Issues

```bash
# Check status
sudo ./deploy-prod.sh status

# View logs
sudo ./deploy-prod.sh logs app

# Open shell in container
sudo ./deploy-prod.sh shell app
```

---

## Troubleshooting

### Out of Memory (OOM)

If build fails with OOM:
```bash
# Check swap
free -h

# Script auto-creates swap, but verify:
swapon --show
```

### Container Not Starting

```bash
# Check logs
sudo ./deploy-prod.sh logs app

# Restart services
sudo ./deploy-prod.sh restart

# Full reset if needed
sudo ./deploy-prod.sh reset
sudo DOMAIN=yourdomain.com ./deploy-prod.sh deploy
```

### SSL Issues

```bash
# Check certificate
sudo ls -la ~/roxas/certbot/conf/live/

# Re-request certificate
sudo DOMAIN=yourdomain.com ./deploy-prod.sh ssl
```

### Database Connection Failed

```bash
# Check if db is running
docker compose -f docker-compose.prod.yml ps db

# View db logs
sudo ./deploy-prod.sh logs db

# Restart db
docker compose -f docker-compose.prod.yml restart db
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    NGINX (SSL)                      │
│                   Port 80/443                       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Next.js App (Port 3000)                │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│  PostgreSQL  │ │  Redis  │ │   Workers   │
│  Port 5432   │ │  6379   │ │  scheduler  │
│              │ │         │ │email-worker │
└──────────────┘ └─────────┘ └─────────────┘
```

---

## File Locations

| Path | Description |
|------|-------------|
| `~/roxas` | Application root |
| `~/roxas/.env.production` | Environment variables |
| `~/roxas/backups/` | Database backups |
| `~/roxas/certbot/conf/` | SSL certificates |

---

## Security Checklist

- [ ] Change default database password in `.env.production`
- [ ] Generate strong `AUTH_SECRET` 
- [ ] Enable firewall (done by `init`)
- [ ] Setup fail2ban (done by `init`)
- [ ] Regular backups (use cron with `backup` command)

---

## Need Help?

1. Check logs: `sudo ./deploy-prod.sh logs`
2. Check status: `sudo ./deploy-prod.sh status`
3. Reset and try again: `sudo ./deploy-prod.sh reset`
