#!/bin/bash

# Gongbu Platform - Production Deployment Script
# Usage: ./deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

log "🚀 Starting Gongbu Platform deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    warning ".env file not found"
    if [ -f ".env.production" ]; then
        info "Copying .env.production to .env"
        cp .env.production .env
        warning "Please edit .env file with your actual values before continuing"
        read -p "Press Enter when ready to continue..."
    else
        error "No environment file found. Please create .env file first."
    fi
fi

# Validate required environment variables
log "📋 Validating environment variables..."
source .env

required_vars=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "TELEGRAM_BOT_TOKEN"
    "DOMAIN_NAME"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
    fi
done

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
fi

# Create necessary directories
log "📁 Creating necessary directories..."
mkdir -p infrastructure/nginx
mkdir -p infrastructure/monitoring
mkdir -p infrastructure/logging
mkdir -p infrastructure/docker/postgres/init
mkdir -p backups/postgres
mkdir -p backups/redis

# Pull latest images
log "🐳 Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing containers
log "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Create backup of existing database (if exists)
if docker volume ls | grep -q "gongbu_postgres_data"; then
    log "💾 Creating database backup..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    docker run --rm \
        -v gongbu_postgres_data:/var/lib/postgresql/data \
        -v $(pwd)/backups/postgres:/backup \
        postgres:15-alpine \
        pg_dumpall -h postgres -U postgres > /backup/backup_${timestamp}.sql || warning "Backup failed, continuing..."
fi

# Build and start services
log "🏗️  Building and starting services..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
log "⏳ Waiting for services to be healthy..."
timeout 300s bash -c '
    until docker-compose -f docker-compose.prod.yml ps | grep -E "(healthy|Up)" | wc -l | grep -q "$(docker-compose -f docker-compose.prod.yml ps | grep -v "Name\|----" | wc -l)"
    do
        echo "Waiting for services..."
        sleep 5
    done
'

# Run database migrations
log "🗄️  Running database migrations..."
services=("auth-service" "course-service" "bot-service" "payment-service" "notification-service")

for service in "${services[@]}"; do
    if [ -d "services/${service}" ]; then
        info "Running migrations for ${service}..."
        docker-compose -f docker-compose.prod.yml exec ${service} npx prisma migrate deploy || warning "Migration failed for ${service}"
    fi
done

# Generate Prisma client
log "🔧 Generating Prisma clients..."
for service in "${services[@]}"; do
    if [ -d "services/${service}" ]; then
        info "Generating Prisma client for ${service}..."
        docker-compose -f docker-compose.prod.yml exec ${service} npx prisma generate || warning "Prisma generate failed for ${service}"
    fi
done

# Setup SSL certificates (if enabled)
if [ "$SSL_ENABLED" = "true" ]; then
    log "🔒 Setting up SSL certificates..."
    if command -v certbot &> /dev/null; then
        certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $SSL_EMAIL || warning "SSL setup failed"
    else
        warning "Certbot not installed. SSL certificates not configured."
    fi
fi

# Setup monitoring
log "📊 Setting up monitoring..."
if [ ! -f "infrastructure/monitoring/prometheus.yml" ]; then
    cat > infrastructure/monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gongbu-services'
    static_configs:
      - targets: ['auth-service:3001', 'course-service:3002', 'bot-service:3003']
EOF
fi

# Create health check script
log "🏥 Creating health check script..."
cat > health-check.sh << 'EOF'
#!/bin/bash
services=("auth-service" "course-service" "bot-service" "postgres" "redis")
all_healthy=true

for service in "${services[@]}"; do
    if ! docker-compose -f docker-compose.prod.yml ps | grep $service | grep -q "healthy\|Up"; then
        echo "❌ $service is not healthy"
        all_healthy=false
    else
        echo "✅ $service is healthy"
    fi
done

if $all_healthy; then
    echo "🎉 All services are healthy!"
    exit 0
else
    echo "⚠️  Some services are not healthy"
    exit 1
fi
EOF
chmod +x health-check.sh

# Show final status
log "🎉 Deployment completed!"
info "Services status:"
docker-compose -f docker-compose.prod.yml ps

info "🌐 Your Gongbu Platform should be available at:"
info "   Web App: https://$DOMAIN_NAME"
info "   API: https://$DOMAIN_NAME/api"
info "   Grafana: https://$DOMAIN_NAME/grafana"

info "📊 To check service health: ./health-check.sh"
info "📄 To view logs: docker-compose -f docker-compose.prod.yml logs -f [service_name]"
info "🔄 To restart: docker-compose -f docker-compose.prod.yml restart [service_name]"
info "🛑 To stop all: docker-compose -f docker-compose.prod.yml down"

log "✅ Deployment completed successfully!"
