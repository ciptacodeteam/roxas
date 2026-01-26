#!/bin/bash

# Deployment script for Roxas to DigitalOcean
# Usage: ./deploy.sh [init|deploy|ssl|backup]

set -e

DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Initialize server (first time setup)
init_server() {
    log_info "Initializing server..."
    
    # Update system
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    
    # Install Docker
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Install Docker Compose
    log_info "Installing Docker Compose..."
    apt install docker-compose-plugin -y
    
    # Create app directory
    log_info "Creating app directory..."
    mkdir -p /var/www/roxas
    cd /var/www/roxas
    
    # Setup firewall
    log_info "Configuring firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    log_info "Server initialized successfully!"
    log_warn "Next steps:"
    log_warn "1. Clone your repository to /var/www/roxas"
    log_warn "2. Create .env file with production variables"
    log_warn "3. Run: ./deploy.sh ssl"
    log_warn "4. Run: ./deploy.sh deploy"
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates for $DOMAIN..."
    
    # Check if domain is set
    if [ "$DOMAIN" == "yourdomain.com" ]; then
        log_error "Please edit deploy.sh and set your domain name!"
        exit 1
    fi
    
    # Create directories
    mkdir -p certbot/conf
    mkdir -p certbot/www
    
    # Get initial certificate
    log_info "Obtaining SSL certificate..."
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    log_info "SSL certificates obtained successfully!"
    log_info "Updating nginx configuration..."
    
    # Update nginx.conf with actual domain
    sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf
    
    log_info "SSL setup complete!"
}

# Deploy application
deploy() {
    log_info "Deploying application..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        log_error ".env file not found!"
        log_warn "Please create .env file with production variables"
        exit 1
    fi
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main
    
    # Build and start containers
    log_info "Building Docker images..."
    docker compose -f docker-compose.prod.yml build
    
    log_info "Starting containers..."
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for database to be ready
    log_info "Waiting for database..."
    sleep 10
    
    # Run migrations
    log_info "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T app bunx prisma migrate deploy
    
    # Check if services are running
    log_info "Checking services..."
    docker compose -f docker-compose.prod.yml ps
    
    log_info "Deployment complete!"
    log_info "Application is running at https://$DOMAIN"
}

# Backup database
backup_db() {
    log_info "Creating database backup..."
    
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    
    docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres roxas > $BACKUP_FILE
    
    log_info "Database backed up to $BACKUP_FILE"
    
    # Keep only last 7 backups
    cd $BACKUP_DIR
    ls -t db_backup_*.sql | tail -n +8 | xargs -r rm
    cd ..
    
    log_info "Old backups cleaned up (keeping last 7)"
}

# Restore database
restore_db() {
    if [ -z "$1" ]; then
        log_error "Please provide backup file path"
        log_warn "Usage: ./deploy.sh restore <backup_file>"
        exit 1
    fi
    
    log_warn "This will restore database from $1"
    read -p "Are you sure? (yes/no) " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring database..."
    docker compose -f docker-compose.prod.yml exec -T db psql -U postgres roxas < $1
    log_info "Database restored successfully!"
}

# View logs
view_logs() {
    SERVICE=${1:-app}
    docker compose -f docker-compose.prod.yml logs -f $SERVICE
}

# Show help
show_help() {
    echo "Roxas Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  init       - Initialize server (first time setup)"
    echo "  ssl        - Setup SSL certificates"
    echo "  deploy     - Deploy application"
    echo "  backup     - Backup database"
    echo "  restore    - Restore database from backup"
    echo "  logs       - View application logs"
    echo "  help       - Show this help message"
    echo ""
}

# Main script
case "$1" in
    init)
        init_server
        ;;
    ssl)
        setup_ssl
        ;;
    deploy)
        deploy
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    logs)
        view_logs "$2"
        ;;
    help|*)
        show_help
        ;;
esac
