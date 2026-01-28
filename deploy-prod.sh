#!/bin/bash
# =============================================================================
# Roxas Production Deployment Script
# Usage: ./deploy-prod.sh [command]
#
# Commands:
#   init      - First time server setup
#   deploy    - Build and deploy application
#   ssl       - Setup SSL certificates
#   update    - Quick update (pull & restart)
#   restart   - Restart all services
#   reset     - Reset everything (DESTRUCTIVE)
#   backup    - Backup database
#   logs      - View logs
#   status    - Check service status
#   seed      - Run database seed
#   shell     - Open shell in app container
# =============================================================================

set -e

# =============================================================================
# Configuration
# =============================================================================
DOMAIN="${DOMAIN:-roxasgamestore.com}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
NETWORK_NAME="roxas_roxas-network"

# Docker compose command with env file
dc() {
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# Helper Functions
# =============================================================================
log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Please run as root (use sudo)"
        exit 1
    fi
}

check_env() {
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found!"
        log_info "Create it with: cp env.example .env.production"
        exit 1
    fi
}

get_db_url() {
    grep "^DATABASE_URL" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

wait_for_healthy() {
    local container=$1
    local max_wait=${2:-60}
    local wait_time=0
    
    echo -n "Waiting for $container..."
    while [ $wait_time -lt $max_wait ]; do
        if dc ps $container | grep -q "healthy\|running"; then
            echo " ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        wait_time=$((wait_time + 2))
    done
    echo " timeout!"
    return 1
}

# =============================================================================
# Command: init - First time server setup
# =============================================================================
cmd_init() {
    log_step "Initializing Server"
    check_root
    
    # Update system
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log_info "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    else
        log_info "Docker already installed"
    fi
    
    # Install Docker Compose
    if ! docker compose version &> /dev/null; then
        log_info "Installing Docker Compose..."
        apt install -y docker-compose-plugin
    fi
    
    # Setup firewall
    log_info "Configuring firewall..."
    apt install -y ufw fail2ban
    ufw --force enable
    ufw allow ssh
    ufw allow http
    ufw allow https
    
    # Setup swap (2GB for low-memory servers)
    if [ ! -f /swapfile ]; then
        log_info "Creating 2GB swap..."
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    
    # Redis memory overcommit
    sysctl vm.overcommit_memory=1
    echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf 2>/dev/null || true
    
    # Create directories
    mkdir -p "$APP_DIR"/{certbot/conf,certbot/www,backups}
    
    log_info "Server initialized!"
    echo ""
    log_warn "Next steps:"
    echo "  1. cp env.example .env.production"
    echo "  2. Edit .env.production with your values"
    echo "  3. sudo DOMAIN=yourdomain.com ./deploy-prod.sh deploy"
}

# =============================================================================
# Command: deploy - Full build and deploy
# =============================================================================
cmd_deploy() {
    log_step "Deploying Application"
    check_root
    check_env
    
    cd "$APP_DIR"
    
    # Update nginx.conf with domain
    log_info "Configuring nginx for $DOMAIN..."
    sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf 2>/dev/null || true
    
    # Free up memory
    log_info "Cleaning Docker resources..."
    docker system prune -af 2>/dev/null || true
    
    # Build images sequentially (prevents OOM on 2-4GB servers)
    log_info "Building Docker images (10-15 minutes)..."
    log_info "Building app..."
    dc build app
    
    log_info "Building scheduler..."
    dc build scheduler
    
    log_info "Building email-worker..."
    dc build email-worker
    
    # Start infrastructure first
    log_info "Starting database and redis..."
    dc up -d db redis
    wait_for_healthy db 60
    
    # Run migrations
    log_info "Running database migrations..."
    cmd_migrate || true
    
    # Start all services
    log_info "Starting all services..."
    dc up -d
    
    # Wait and check
    sleep 10
    cmd_status
    
    log_info "Deployment complete!"
    echo ""
    log_warn "Next: sudo DOMAIN=$DOMAIN ./deploy-prod.sh ssl"
}

# =============================================================================
# Command: ssl - Setup SSL with Let's Encrypt
# =============================================================================
cmd_ssl() {
    log_step "Setting Up SSL"
    check_root
    
    if [ "$DOMAIN" = "yourdomain.com" ]; then
        log_error "Set DOMAIN: sudo DOMAIN=example.com ./deploy-prod.sh ssl"
        exit 1
    fi
    
    cd "$APP_DIR"
    
    # Check if certificate already exists
    if [ -d "$APP_DIR/certbot/conf/live/$DOMAIN" ]; then
        log_info "Certificate already exists for $DOMAIN"
        read -p "Renew certificate? (y/N): " renew
        if [ "$renew" != "y" ] && [ "$renew" != "Y" ]; then
            return 0
        fi
    fi
    
    # Stop nginx
    log_info "Stopping nginx..."
    dc stop nginx 2>/dev/null || true
    
    # Request certificate
    log_info "Requesting certificate for $DOMAIN..."
    docker run --rm \
        -p 80:80 \
        -v "$APP_DIR/certbot/conf:/etc/letsencrypt" \
        -v "$APP_DIR/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Restart nginx
    log_info "Starting nginx..."
    dc up -d nginx
    
    # Setup auto-renewal cron
    log_info "Setting up auto-renewal cron..."
    local cron_job="0 3 1 * * cd $APP_DIR && ./deploy-prod.sh ssl-renew"
    (crontab -l 2>/dev/null | grep -v "ssl-renew"; echo "$cron_job") | crontab -
    
    log_info "SSL setup complete!"
    echo ""
    log_info "Your site: https://$DOMAIN"
}

# =============================================================================
# Command: ssl-renew - Renew SSL (for cron)
# =============================================================================
cmd_ssl_renew() {
    cd "$APP_DIR"
    dc stop nginx
    docker run --rm \
        -p 80:80 \
        -v "$APP_DIR/certbot/conf:/etc/letsencrypt" \
        certbot/certbot renew --quiet
    dc start nginx
}

# =============================================================================
# Command: update - Quick update without rebuild
# =============================================================================
cmd_update() {
    log_step "Quick Update"
    check_root
    
    cd "$APP_DIR"
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main || git pull origin master
    
    # Update nginx config
    sed -i "s/yourdomain.com/$DOMAIN/g" nginx.conf 2>/dev/null || true
    
    # Rebuild only changed images
    log_info "Rebuilding images..."
    dc build --no-cache app
    dc build --no-cache scheduler
    dc build --no-cache email-worker
    
    # Rolling restart
    log_info "Restarting services..."
    dc up -d
    
    # Run migrations
    cmd_migrate || true
    
    cmd_status
    log_info "Update complete!"
}

# =============================================================================
# Command: reset - Reset everything (DESTRUCTIVE)
# =============================================================================
cmd_reset() {
    log_step "Reset Everything"
    check_root
    
    echo -e "${RED}⚠️  WARNING: This will DELETE all data including:${NC}"
    echo "  - All Docker containers and images"
    echo "  - Database and Redis data"
    echo "  - All volumes"
    echo ""
    read -p "Type 'RESET' to confirm: " confirm
    
    if [ "$confirm" != "RESET" ]; then
        log_info "Reset cancelled"
        exit 0
    fi
    
    cd "$APP_DIR"
    
    # Backup first
    log_info "Creating backup before reset..."
    cmd_backup 2>/dev/null || true
    
    # Stop everything
    log_info "Stopping all containers..."
    dc down -v --remove-orphans 2>/dev/null || true
    
    # Remove images
    log_info "Removing Docker images..."
    docker images -q | xargs -r docker rmi -f 2>/dev/null || true
    
    # Clean Docker
    log_info "Cleaning Docker system..."
    docker system prune -af --volumes
    
    # Optional: Remove SSL
    read -p "Remove SSL certificates? (y/N): " remove_ssl
    if [ "$remove_ssl" = "y" ]; then
        rm -rf "$APP_DIR/certbot/conf/"*
        log_info "SSL certificates removed"
    fi
    
    log_info "Reset complete!"
    echo ""
    log_warn "To rebuild: sudo DOMAIN=$DOMAIN ./deploy-prod.sh deploy"
}

# =============================================================================
# Command: backup - Backup database
# =============================================================================
cmd_backup() {
    log_info "Creating database backup..."
    cd "$APP_DIR"
    
    mkdir -p backups
    local backup_file="backups/roxas_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    dc exec -T db \
        pg_dump -U postgres roxas | gzip > "$backup_file"
    
    log_info "Backup saved: $backup_file"
    
    # Keep only last 10 backups
    ls -t backups/*.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
}

# =============================================================================
# Command: restore - Restore database from backup
# =============================================================================
cmd_restore() {
    log_step "Restore Database"
    cd "$APP_DIR"
    
    # List backups
    echo "Available backups:"
    ls -la backups/*.gz 2>/dev/null || { log_error "No backups found"; exit 1; }
    echo ""
    
    read -p "Enter backup filename: " backup_file
    
    if [ ! -f "$backup_file" ]; then
        log_error "File not found: $backup_file"
        exit 1
    fi
    
    log_warn "This will replace current database!"
    read -p "Continue? (y/N): " confirm
    [ "$confirm" != "y" ] && exit 0
    
    log_info "Restoring from $backup_file..."
    gunzip -c "$backup_file" | dc exec -T db \
        psql -U postgres roxas
    
    log_info "Restore complete!"
}

# =============================================================================
# Command: migrate - Run database migrations
# =============================================================================
cmd_migrate() {
    cd "$APP_DIR"
    check_env
    
    log_info "Running migrations..."
    
    # Get DB credentials from env file
    local db_password=$(grep "^DB_PASSWORD" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    local db_url="postgresql://postgres:${db_password:-password}@db:5432/roxas"
    
    docker run --rm \
        --network $NETWORK_NAME \
        -v "$APP_DIR/prisma:/app/prisma" \
        -e DATABASE_URL="$db_url" \
        oven/bun:1.3-alpine \
        sh -c "cd /app && bun add prisma@6.5.0 @prisma/client@6.5.0 && bunx prisma migrate deploy" 2>/dev/null || \
    docker run --rm \
        --network $NETWORK_NAME \
        -v "$APP_DIR/prisma:/app/prisma" \
        -e DATABASE_URL="$db_url" \
        oven/bun:1.3-alpine \
        sh -c "cd /app && bun add prisma@6.5.0 @prisma/client@6.5.0 && bunx prisma db push --accept-data-loss" || \
    log_warn "Migration may have already been applied"
}

# =============================================================================
# Command: seed - Run database seed
# =============================================================================
cmd_seed() {
    log_step "Seeding Database"
    cd "$APP_DIR"
    check_env
    
    log_info "Running seed script..."
    
    # Get DB credentials from env file
    local db_password=$(grep "^DB_PASSWORD" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    local db_url="postgresql://postgres:${db_password:-password}@db:5432/roxas"
    
    docker run --rm \
        --network $NETWORK_NAME \
        -v "$APP_DIR:/app" \
        -w /app \
        -e DATABASE_URL="$db_url" \
        oven/bun:1.3-alpine \
        sh -c "bun install && bun run prisma/seed.ts"
    
    log_info "Seed complete!"
}

# =============================================================================
# Command: logs - View logs
# =============================================================================
cmd_logs() {
    cd "$APP_DIR"
    local service="${2:-}"
    
    if [ -z "$service" ]; then
        dc logs -f --tail=100
    else
        dc logs -f --tail=100 "$service"
    fi
}

# =============================================================================
# Command: status - Show status
# =============================================================================
cmd_status() {
    cd "$APP_DIR"
    
    echo ""
    log_info "Container Status:"
    dc ps
    
    echo ""
    log_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
    
    echo ""
    log_info "Health Check:"
    curl -s -o /dev/null -w "  App: %{http_code}\n" http://localhost:3000/api/health 2>/dev/null || echo "  App: not responding"
}

# =============================================================================
# Command: restart - Restart services
# =============================================================================
cmd_restart() {
    log_info "Restarting services..."
    cd "$APP_DIR"
    dc restart
    cmd_status
}

# =============================================================================
# Command: shell - Open shell in container
# =============================================================================
cmd_shell() {
    local service="${2:-app}"
    dc exec "$service" sh
}

# =============================================================================
# Command: help - Show help
# =============================================================================
cmd_help() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════╗
║                    Roxas Production Deployment Script                     ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
    sudo ./deploy-prod.sh [command]
    sudo DOMAIN=example.com ./deploy-prod.sh [command]

COMMANDS:
    init        First-time server setup (Docker, firewall, swap)
    deploy      Full build and deploy (takes 10-15 min)
    ssl         Setup Let's Encrypt SSL certificates
    update      Quick update: pull, rebuild, restart
    restart     Restart all services
    reset       Delete everything and start fresh (DESTRUCTIVE)
    
    backup      Create database backup
    restore     Restore database from backup
    migrate     Run database migrations
    seed        Run database seed script
    
    logs        View logs (all or specific service)
    status      Show container status and health
    shell       Open shell in container

EXAMPLES:
    # First time setup
    sudo ./deploy-prod.sh init
    cp env.example .env.production
    nano .env.production
    sudo DOMAIN=mysite.com ./deploy-prod.sh deploy
    sudo DOMAIN=mysite.com ./deploy-prod.sh ssl
    sudo ./deploy-prod.sh seed
    
    # Regular updates
    sudo ./deploy-prod.sh update
    
    # View logs
    sudo ./deploy-prod.sh logs app
    sudo ./deploy-prod.sh logs nginx
    
    # Reset and rebuild
    sudo ./deploy-prod.sh reset
    sudo DOMAIN=mysite.com ./deploy-prod.sh deploy

EOF
}

# =============================================================================
# Main
# =============================================================================
cd "$APP_DIR"

case "${1:-}" in
    init)       cmd_init ;;
    deploy)     cmd_deploy ;;
    ssl)        cmd_ssl ;;
    ssl-renew)  cmd_ssl_renew ;;
    update)     cmd_update ;;
    reset)      cmd_reset ;;
    restart)    cmd_restart ;;
    backup)     cmd_backup ;;
    restore)    cmd_restore ;;
    migrate)    cmd_migrate ;;
    seed)       cmd_seed ;;
    logs)       cmd_logs "$@" ;;
    status)     cmd_status ;;
    shell)      cmd_shell "$@" ;;
    help|--help|-h) cmd_help ;;
    *)          cmd_help ;;
esac
