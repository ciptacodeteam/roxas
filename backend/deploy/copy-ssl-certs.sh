#!/bin/bash

# Copy Let's Encrypt certificates into the nginx bind-mount and reload nginx.
# Used as a certbot deploy hook and by ssl-setup.sh / renew-ssl.sh.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="${APP_DIR:-$(dirname "$SCRIPT_DIR")}"
DOMAIN="${CERTBOT_DOMAIN:-${DOMAIN:-data.roxasgamestore.com}}"

LIVE_DIR="/etc/letsencrypt/live/$DOMAIN"
DEST_DIR="$APP_DIR/nginx/ssl/$DOMAIN"

if [ ! -f "$LIVE_DIR/fullchain.pem" ] || [ ! -f "$LIVE_DIR/privkey.pem" ] || [ ! -f "$LIVE_DIR/chain.pem" ]; then
    echo "Error: Let's Encrypt files not found in $LIVE_DIR" >&2
    exit 1
fi

mkdir -p "$DEST_DIR"
cp "$LIVE_DIR/fullchain.pem" "$DEST_DIR/fullchain.pem"
cp "$LIVE_DIR/privkey.pem" "$DEST_DIR/privkey.pem"
cp "$LIVE_DIR/chain.pem" "$DEST_DIR/chain.pem"
chmod 644 "$DEST_DIR/fullchain.pem" "$DEST_DIR/chain.pem"
chmod 600 "$DEST_DIR/privkey.pem"

if command -v openssl >/dev/null 2>&1; then
    echo "Installed certificate for $DOMAIN:"
    openssl x509 -in "$DEST_DIR/fullchain.pem" -noout -subject -dates
fi

cd "$APP_DIR"
if docker compose -f docker-compose.prod.yml ps nginx 2>/dev/null | grep -q "Up"; then
    docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
    docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
    echo "Nginx reloaded with new certificate"
else
    echo "Nginx is not running; certificate files were copied to $DEST_DIR"
fi
