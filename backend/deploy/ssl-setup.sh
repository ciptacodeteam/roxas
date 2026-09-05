#!/bin/bash

# SSL Certificate Setup Script
# Issues (or renews) a Let's Encrypt certificate for data.roxasgamestore.com
# using HTTP-01 webroot so nginx can stay up, then installs twice-daily auto-renewal.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="${APP_DIR:-$PROJECT_DIR}"

echo -e "${BLUE}=========================================="
echo "SSL Certificate Setup"
echo "==========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Domain configuration
DOMAIN="data.roxasgamestore.com"
EMAIL="${SSL_EMAIL:-admin@roxasgamestore.com}"
WEBROOT="$APP_DIR/certbot/www"

echo -e "${YELLOW}Domain: ${DOMAIN}${NC}"
echo -e "${YELLOW}Email: ${EMAIL}${NC}"
echo -e "${YELLOW}Webroot: ${WEBROOT}${NC}"
echo ""

chmod +x "$SCRIPT_DIR/copy-ssl-certs.sh" "$SCRIPT_DIR/renew-ssl.sh"

# Check if DNS is configured
echo -e "${BLUE}[1/7] Checking DNS configuration...${NC}"
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
DNS_IP=$(dig +short "$DOMAIN" A | tail -n1)

if [ -z "$DNS_IP" ]; then
    echo -e "${RED}Error: DNS not configured for $DOMAIN${NC}"
    echo "Please configure an A record pointing to: $SERVER_IP"
    exit 1
fi

if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠ Warning: DNS IP ($DNS_IP) doesn't match server IP ($SERVER_IP)${NC}"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo -e "${GREEN}✓ DNS configured correctly${NC}"
fi

# Check if services are running
echo ""
echo -e "${BLUE}[2/7] Checking if services are running...${NC}"
cd "$APP_DIR"
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${RED}Error: Services are not running!${NC}"
    echo "Please run: sudo ./deploy/deploy.sh first"
    exit 1
fi
echo -e "${GREEN}✓ Services are running${NC}"

# Prepare webroot and recreate nginx so the ACME volume is mounted
echo ""
echo -e "${BLUE}[3/7] Preparing HTTP-01 webroot (nginx stays up)...${NC}"
mkdir -p "$WEBROOT/.well-known/acme-challenge"
chmod 755 "$WEBROOT"

# Recreate nginx so docker-compose picks up ./certbot/www
docker compose -f docker-compose.prod.yml up -d nginx
sleep 3

if ! docker compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
    echo -e "${RED}Error: Nginx is not running${NC}"
    docker compose -f docker-compose.prod.yml logs nginx | tail -20
    exit 1
fi
echo -e "${GREEN}✓ Nginx is serving /.well-known/acme-challenge/${NC}"

# Install deploy hook so certbot.timer / certbot renew always copy certs into nginx
echo ""
echo -e "${BLUE}[4/7] Installing certbot deploy hook...${NC}"
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/roxas-copy-certs.sh <<EOF
#!/bin/bash
export APP_DIR="$APP_DIR"
export DOMAIN="$DOMAIN"
"$APP_DIR/deploy/copy-ssl-certs.sh"
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/roxas-copy-certs.sh
echo -e "${GREEN}✓ Deploy hook installed${NC}"

# Issue or renew certificate via webroot (does not bind port 80)
echo ""
echo -e "${BLUE}[5/7] Requesting SSL certificate (webroot)...${NC}"
CERTBOT_KEEP_OR_FORCE=(--keep-until-expiring)
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    if ! openssl x509 -checkend 86400 -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
        echo "Existing certificate is expired or expires within 24h; forcing renewal"
        CERTBOT_KEEP_OR_FORCE=(--force-renewal)
    fi
fi

certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    "${CERTBOT_KEEP_OR_FORCE[@]}" \
    --preferred-challenges http || {
    echo -e "${RED}Error: Certificate generation failed${NC}"
    echo "Common issues:"
    echo "  - DNS not pointing to this server"
    echo "  - Port 80 not accessible from the internet"
    echo "  - Nginx is not mounting $WEBROOT at /var/www/certbot"
    echo "  - Too many certificate requests (Let's Encrypt rate limit)"
    exit 1
}

# Copy certificates (hook should already have done this; run again to be sure)
echo ""
echo -e "${BLUE}[6/7] Installing certificates into nginx...${NC}"
"$SCRIPT_DIR/copy-ssl-certs.sh"
echo -e "${GREEN}✓ Certificates installed${NC}"

# Ensure docker-compose is using the SSL server config
echo ""
echo -e "${BLUE}Updating Docker Compose configuration for SSL...${NC}"
cd "$APP_DIR"

sed -i 's|- ./nginx/data.roxasgamestore.com.http-only.conf:/etc/nginx/conf.d/data.roxasgamestore.com.conf:ro|# - ./nginx/data.roxasgamestore.com.http-only.conf:/etc/nginx/conf.d/data.roxasgamestore.com.conf:ro|g' docker-compose.prod.yml
sed -i 's|# - ./nginx/data.roxasgamestore.com.conf:/etc/nginx/conf.d/data.roxasgamestore.com.conf:ro|- ./nginx/data.roxasgamestore.com.conf:/etc/nginx/conf.d/data.roxasgamestore.com.conf:ro|g' docker-compose.prod.yml
sed -i 's|# - ./nginx/ssl:/etc/nginx/ssl:ro|- ./nginx/ssl:/etc/nginx/ssl:ro|g' docker-compose.prod.yml

docker compose -f docker-compose.prod.yml up -d nginx
sleep 3

if docker compose -f docker-compose.prod.yml exec -T nginx nginx -t > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}Error: Nginx configuration is invalid!${NC}"
    docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
    exit 1
fi

if docker compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
    echo -e "${GREEN}✓ Nginx started successfully${NC}"
else
    echo -e "${RED}Error: Nginx failed to start${NC}"
    docker compose -f docker-compose.prod.yml logs nginx | tail -20
    exit 1
fi

# Replace the broken monthly cron with twice-daily renewal
echo ""
echo -e "${BLUE}[7/7] Setting up certificate auto-renewal...${NC}"

# Old setup used /etc/cron.monthly + certbot standalone, which cannot renew
# while nginx is bound to port 80. Remove it so it cannot fight the new job.
rm -f /etc/cron.monthly/renew-ssl-cert

cat > /etc/cron.d/roxas-ssl-renew <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Let's Encrypt certs last 90 days; renew twice daily when within 30 days of expiry.
0 3,15 * * * root $APP_DIR/deploy/renew-ssl.sh >> /var/log/letsencrypt/roxas-renew.log 2>&1
EOF
chmod 644 /etc/cron.d/roxas-ssl-renew
mkdir -p /var/log/letsencrypt
touch /var/log/letsencrypt/roxas-renew.log

# Ubuntu's certbot package also ships a systemd timer. Enable it so deploy
# hooks in /etc/letsencrypt/renewal-hooks/deploy still run if cron is off.
if command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now certbot.timer >/dev/null 2>&1 || true
fi

echo -e "${GREEN}✓ Auto-renewal configured (twice daily via cron)${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ SSL Setup Complete!"
echo "=========================================="
echo "${NC}"

echo -e "${BLUE}Certificate Details:${NC}"
certbot certificates

echo ""
echo -e "${GREEN}Your site is now available at: https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  - Certificates auto-renew twice daily (certbot skips until 30 days remain)"
echo "  - Renewal uses HTTP-01 webroot; nginx is not stopped"
echo "  - Manual renew: ${BLUE}sudo ./deploy/renew-ssl.sh${NC}"
echo "  - Logs: ${BLUE}/var/log/letsencrypt/roxas-renew.log${NC}"
echo "  - Update your .env file:"
echo "    ${BLUE}SECURE_SSL_REDIRECT=1${NC}"
echo "    ${BLUE}SESSION_COOKIE_SECURE=1${NC}"
echo "    ${BLUE}CSRF_COOKIE_SECURE=1${NC}"
echo ""
echo -e "${GREEN}SSL setup complete! 🎉${NC}"
echo ""
