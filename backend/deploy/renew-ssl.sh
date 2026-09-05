#!/bin/bash

# Renew Let's Encrypt certificates via HTTP-01 webroot, then sync nginx.
# Safe to run from cron twice daily. Certbot is a no-op when renewal is not due.
#
# Always uses webroot so renewal does not need to bind port 80 (nginx already owns it).

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="${APP_DIR:-$(dirname "$SCRIPT_DIR")}"
DOMAIN="${DOMAIN:-data.roxasgamestore.com}"
EMAIL="${SSL_EMAIL:-admin@roxasgamestore.com}"
WEBROOT="$APP_DIR/certbot/www"

mkdir -p "$WEBROOT/.well-known/acme-challenge"

echo "$(date -Is) Starting SSL renewal for $DOMAIN"

CERTBOT_KEEP_OR_FORCE=(--keep-until-expiring)
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    if ! openssl x509 -checkend 86400 -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
        echo "Existing certificate is expired or expires within 24h; forcing renewal"
        CERTBOT_KEEP_OR_FORCE=(--force-renewal)
    fi
fi

# certonly --webroot updates the saved authenticator away from standalone
# and is a no-op when the cert is not yet due (--keep-until-expiring).
certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    "${CERTBOT_KEEP_OR_FORCE[@]}" \
    --preferred-challenges http

"$SCRIPT_DIR/copy-ssl-certs.sh"

echo "$(date -Is) SSL renewal finished"
