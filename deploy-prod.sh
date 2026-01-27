#!/bin/bash

# Production Deployment Script for Roxas
# Usage: ./deploy-prod.sh [init|deploy|pull|ssl|restart|logs|backup]
#
# Commands:
#   init    - First time server setup (install Docker, create directories, etc.)
#   deploy  - Full deployment from scratch (build images locally - SLOW)
#   pull    - Deploy using pre-built images from registry (FAST - recommended)
#   ssl     - Setup SSL certificates with Let's Encrypt
#   restart - Restart all services
#   logs    - View logs
#   backup  - Create database backup

set -e

# Configuration - UPDATE THESE VALUES
DOMAIN="${DOMAIN:-yourdomain.com}"
EMAIL="${EMAIL:-your-email@example.com}"
# Use current directory as APP_DIR (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Please run as root (use sudo)"
        exit 1
    fi
}

# Initialize server (first time only)
init_server() {
    log_step "Initializing server for first-time deployment..."
    check_root
    
    # Update system
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    
    # Install required packages
    log_info "Installing required packages..."
    apt install -y curl git ufw fail2ban
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    else
        log_info "Docker already installed"
    fi
    
    # Install Docker Compose
    if ! docker compose version &> /dev/null; then
        log_info "Installing Docker Compose..."
        apt install -y docker-compose-plugin
    else
        log_info "Docker Compose already installed"
    fi
    
    # Setup firewall
    log_info "Configuring firewall..."
    ufw --force enable
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw status
    
    # Create app directory
    log_info "Creating app directory..."
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/volumes/certbot/conf
    mkdir -p $APP_DIR/volumes/certbot/www
    mkdir -p $APP_DIR/volumes/postgres
    mkdir -p $APP_DIR/volumes/redis
    mkdir -p $APP_DIR/backups
    
    log_info "Server initialization complete!"
    log_warn "Next steps:"
    log_warn "1. Clone/copy your code to $APP_DIR"
    log_warn "2. Create .env.production file with your configuration"
    log_warn "3. Run: ./deploy-prod.sh deploy"
}

# Deploy application from scratch
deploy_app() {
    log_step "Starting full production deployment..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found!"
        log_error "Please create .env.production with your production configuration"
        exit 1
    fi
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down || true
    
    # Update nginx.conf with actual domain
    log_info "Updating nginx configuration..."
    if [ ! -f "nginx.conf.backup" ]; then
        cp nginx.conf nginx.conf.backup
    fi
    sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf
    
    # Pull latest code (if git repo)
    if [ -d ".git" ]; then
        log_info "Pulling latest code..."
        git pull origin main || git pull origin master || true
    fi
    
    # Build and start services
    log_info "Building Docker images..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    log_info "Starting services..."
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to start..."
    sleep 10
    
    # Run database migrations
    log_info "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T app bunx prisma migrate deploy || log_warn "Migration failed or already applied"
    
    # Generate Prisma Client
    log_info "Generating Prisma Client..."
    docker compose -f docker-compose.prod.yml exec -T app bunx prisma generate || log_warn "Prisma generate failed"
    
    # Show service status
    log_info "Service status:"
    docker compose -f docker-compose.prod.yml ps
    
    log_info "Deployment complete!"
    log_warn "Next step: Run './deploy-prod.sh ssl' to setup SSL certificates"
}

# Setup SSL certificates
setup_ssl() {
    log_step "Setting up SSL certificates..."
    
    # Check if domain is provided
    if [ "$DOMAIN" = "yourdomain.com" ]; then
        log_error "Please set DOMAIN environment variable or update the script"
        log_error "Example: DOMAIN=example.com EMAIL=admin@example.com ./deploy-prod.sh ssl"
        exit 1
    fi
    
    # Stop nginx temporarily
    log_info "Stopping nginx..."
    docker compose -f docker-compose.prod.yml stop nginx
    
    # Request certificate
    log_info "Requesting SSL certificate for $DOMAIN..."
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Start nginx with SSL
    log_info "Starting nginx with SSL..."
    docker compose -f docker-compose.prod.yml up -d nginx
    
    # Setup auto-renewal
    log_info "Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 3 * * * cd $APP_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml restart nginx") | crontab -
    
    log_info "SSL setup complete!"
    log_info "Your site should now be accessible at https://$DOMAIN"
}

# Restart services
restart_services() {
    log_step "Restarting services..."
    docker compose -f docker-compose.prod.yml restart
    log_info "Services restarted"
    docker compose -f docker-compose.prod.yml ps
}

# View logs
view_logs() {
    log_step "Viewing application logs..."
    docker compose -f docker-compose.prod.yml logs -f --tail=100
}

# Backup database
backup_database() {
    log_step "Creating database backup..."
    
    BACKUP_FILE="backups/postgres_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "Backing up database to $BACKUP_FILE..."
    docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres roxas > $BACKUP_FILE
    
    # Compress backup
    gzip $BACKUP_FILE
    
    log_info "Backup created: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 backups
    log_info "Cleaning old backups..."
    ls -t backups/postgres_backup_*.sql.gz | tail -n +8 | xargs -r rm
    
    log_info "Backup complete!"
}

# Deploy using pre-built images from registry (FAST)
pull_deploy() {
    log_step "Deploying from container registry (fast mode)..."
    
    # Check required vars
    if [ -z "$GITHUB_REPO" ]; then
        log_error "GITHUB_REPO not set. Example: GITHUB_REPO=yourusername/roxas ./deploy-prod.sh pull"
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found!"
        exit 1
    fi
    
    # Export for docker-compose
    export GITHUB_REPO
    
    # Login to GitHub Container Registry
    log_info "Logging into GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin || log_warn "Already logged in or using public images"
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker compose -f docker-compose.prod.registry.yml down || true
    
    # Update nginx.conf with actual domain
    if [ "$DOMAIN" != "yourdomain.com" ] && [ -n "$DOMAIN" ]; then
        log_info "Updating nginx configuration..."
        sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf
    fi
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker compose -f docker-compose.prod.registry.yml pull
    
    # Start services
    log_info "Starting services..."
    docker compose -f docker-compose.prod.registry.yml up -d
    
    # Wait for services
    log_info "Waiting for services to start..."
    sleep 15
    
    # Run migrations
    log_info "Running database migrations..."
    docker compose -f docker-compose.prod.registry.yml exec -T app bunx prisma migrate deploy || log_warn "Migration failed or already applied"
    
    # Show status
    log_info "Service status:"
    docker compose -f docker-compose.prod.registry.yml ps
    
    log_info "Deployment complete! 🚀"
    log_info "Pull deployment is ~10x faster than build deployment"
}

# Main script
case "$1" in
    init)
        init_server
        ;;
    deploy)
        deploy_app
        ;;
    pull)
        pull_deploy
        ;;
    ssl)
        setup_ssl
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs
        ;;
    backup)
        backup_database
        ;;
    *)
        echo "Usage: $0 {init|deploy|pull|ssl|restart|logs|backup}"
        echo ""
        echo "Commands:"
        echo "  init    - First time server setup"
        echo "  deploy  - Full deployment (builds locally - SLOW)"
        echo "  pull    - Deploy from registry (FAST - recommended)"
        echo "  ssl     - Setup SSL certificates"
        echo "  restart - Restart all services"
        echo "  logs    - View application logs"
        echo "  backup  - Backup database"
        echo ""
        echo "Example first-time deployment:"
        echo "  sudo ./deploy-prod.sh init"
        echo "  # Copy code and create .env.production"
        echo "  sudo DOMAIN=example.com GITHUB_REPO=user/roxas ./deploy-prod.sh pull"
        echo "  sudo DOMAIN=example.com EMAIL=admin@example.com ./deploy-prod.sh ssl"
        exit 1
        ;;
esac
