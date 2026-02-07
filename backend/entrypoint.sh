#!/bin/sh

set -euo pipefail

# Create logs directory (required for Django logging)
mkdir -p /app/logs 2>/dev/null || true
chmod 777 /app/logs 2>/dev/null || true
# Ensure log files are writable (fix RotatingFileHandler permission errors)
touch /app/logs/django.log 2>/dev/null || true
chmod 666 /app/logs/django.log 2>/dev/null || true
chmod 666 /app/logs/django.log.* 2>/dev/null || true

# Create media directories if they don't exist (needed for volume mounts)
# Handle case where file exists instead of directory (common Docker volume issue)
if [ ! -d /app/media ]; then
    mkdir -p /app/media
fi

# Create media directory structure for game store
mkdir -p /app/media/profile_photos \
         /app/media/category_instructions \
         /app/media/products \
         /app/media/products/banners \
         /app/media/product_items \
         /app/media/banners 2>/dev/null || true

# Ensure proper permissions
chmod -R 755 /app/media 2>/dev/null || true

# Production checks
if [ "${DEBUG:-0}" = "0" ]; then
    # Verify SECRET_KEY is set in production
    if [ -z "${SECRET_KEY:-}" ] || [ "${SECRET_KEY}" = "change-me" ] || [ "${SECRET_KEY}" = "change-me-to-secure-random-key" ]; then
        echo "ERROR: SECRET_KEY must be set to a secure value in production!"
        exit 1
    fi
    
    # Verify ALLOWED_HOSTS includes the domain
    if [ -z "${ALLOWED_HOSTS:-}" ]; then
        echo "WARNING: ALLOWED_HOSTS is not set in production!"
    fi
fi

# Clean Python cache to avoid stale migration discovery issues
echo "Cleaning Python cache..."
find /app -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find /app -type f -name "*.pyc" -delete 2>/dev/null || true

# Verify migrations exist (helpful for debugging)
echo "Checking for migrations..."
if [ ! -f /app/account/migrations/__init__.py ]; then
    echo "ERROR: account/migrations/__init__.py not found!"
    echo "Available app structure:"
    ls -la /app/account/
    exit 1
fi
if [ ! -f /app/main/migrations/__init__.py ]; then
    echo "ERROR: main/migrations/__init__.py not found!"
    exit 1
fi

# Run migrations first
python manage.py migrate --noinput

exec "$@"

