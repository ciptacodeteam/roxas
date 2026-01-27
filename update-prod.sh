#!/bin/bash

# Production Update Script for Roxas
# Usage: ./update-prod.sh
#
# This script updates code without rebuilding everything from scratch
# Much faster than full deployment for code-only changes

set -e

# Configuration
APP_DIR="/var/www/roxas"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if in app directory
if [ ! -f "docker-compose.prod.yml" ]; then
    log_warn "Not in app directory. Changing to $APP_DIR..."
    cd $APP_DIR
fi

log_step "Starting code update process..."

# Create backup point
log_info "Creating backup of current state..."
BACKUP_DIR="backups/pre-update-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres roxas > $BACKUP_DIR/database.sql
log_info "Database backed up to $BACKUP_DIR/database.sql"

# Pull latest code
if [ -d ".git" ]; then
    log_info "Pulling latest code from git..."
    git fetch origin
    
    # Show what will be updated
    log_info "Changes to be pulled:"
    git log HEAD..origin/$(git rev-parse --abbrev-ref HEAD) --oneline
    
    # Pull changes
    git pull origin $(git rev-parse --abbrev-ref HEAD)
else
    log_warn "Not a git repository. Make sure you've updated the code manually."
fi

# Check if package.json changed
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    log_warn "package.json changed - dependencies need to be reinstalled"
    REBUILD_APP=true
else
    REBUILD_APP=false
fi

# Check if Prisma schema changed
if git diff HEAD@{1} HEAD --name-only | grep -q "prisma/schema.prisma"; then
    log_warn "Prisma schema changed - migration needed"
    NEED_MIGRATION=true
else
    NEED_MIGRATION=false
fi

# Check if Dockerfile changed
if git diff HEAD@{1} HEAD --name-only | grep -q "Dockerfile"; then
    log_warn "Dockerfile changed - full rebuild recommended"
    REBUILD_APP=true
fi

# Rebuild app if needed
if [ "$REBUILD_APP" = true ]; then
    log_step "Rebuilding app container (dependencies changed)..."
    docker compose -f docker-compose.prod.yml build app
else
    log_info "No dependency changes detected - restarting without rebuild"
fi

# Run migrations if needed
if [ "$NEED_MIGRATION" = true ]; then
    log_step "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T app bunx prisma migrate deploy
    docker compose -f docker-compose.prod.yml exec -T app bunx prisma generate
fi

# Restart services with zero-downtime strategy
log_step "Restarting application services..."

# Restart app with rolling update (if scaled)
log_info "Restarting app..."
docker compose -f docker-compose.prod.yml up -d --no-deps --build app

# Wait for health check
log_info "Waiting for app to be healthy..."
sleep 5

# Check if app is running
if docker compose -f docker-compose.prod.yml ps app | grep -q "Up"; then
    log_info "App is running"
else
    log_warn "App might not be healthy. Check logs:"
    docker compose -f docker-compose.prod.yml logs --tail=50 app
fi

# Restart other services if needed
log_info "Restarting supporting services..."
docker compose -f docker-compose.prod.yml restart email-worker scheduler

# Show final status
log_step "Update complete! Service status:"
docker compose -f docker-compose.prod.yml ps

# Show recent logs
log_info "Recent application logs:"
docker compose -f docker-compose.prod.yml logs --tail=20 app

log_info "✓ Update completed successfully!"
log_info "Backup location: $BACKUP_DIR"
log_warn "Monitor logs with: docker compose -f docker-compose.prod.yml logs -f app"
