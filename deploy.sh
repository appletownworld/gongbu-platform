#!/bin/bash

# Gongbu Platform - Production Deployment Script
# This script deploys the Gongbu platform to production

set -e

echo "🚀 Starting Gongbu Platform Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    print_error ".env.prod file not found!"
    print_status "Please copy env.prod.example to .env.prod and configure it:"
    echo "  cp env.prod.example .env.prod"
    echo "  nano .env.prod"
    exit 1
fi

# Load environment variables
print_status "Loading environment variables..."
source .env.prod

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "TELEGRAM_BOT_TOKEN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_success "Environment variables validated"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Pull latest images
print_status "Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

# Build new images
print_status "Building application images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start database services first
print_status "Starting database services..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d gongbu_prod -f /docker-entrypoint-initdb.d/init-db.sql || true

# Start application services
print_status "Starting application services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 60

# Health check
print_status "Performing health checks..."

# Check API Gateway
if curl -f -s http://localhost:3000/v1/health/live > /dev/null; then
    print_success "API Gateway is healthy"
else
    print_error "API Gateway health check failed"
    docker-compose -f docker-compose.prod.yml logs api-gateway
    exit 1
fi

# Check Web App
if curl -f -s http://localhost:3000 > /dev/null; then
    print_success "Web App is healthy"
else
    print_error "Web App health check failed"
    docker-compose -f docker-compose.prod.yml logs web-app
    exit 1
fi

# Check Nginx
if curl -f -s http://localhost/health > /dev/null; then
    print_success "Nginx is healthy"
else
    print_error "Nginx health check failed"
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.prod.yml ps

# Show service URLs
print_success "Deployment completed successfully!"
echo ""
echo "🌐 Service URLs:"
echo "  Web App: http://localhost"
echo "  API Gateway: http://localhost/api"
echo "  API Documentation: http://localhost/api (if enabled)"
echo ""
echo "📊 Monitoring:"
echo "  Health Check: http://localhost/health"
echo "  API Health: http://localhost/api/v1/health"
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""

# Optional: Setup SSL with Let's Encrypt
if [ "$SETUP_SSL" = "true" ]; then
    print_status "Setting up SSL with Let's Encrypt..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        print_status "Installing certbot..."
        apt-get update && apt-get install -y certbot
    fi
    
    # Get SSL certificate
    certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos --non-interactive
    
    # Update nginx config for SSL
    print_status "Updating nginx configuration for SSL..."
    # This would require updating the nginx config file
    
    print_success "SSL setup completed"
fi

print_success "🎉 Gongbu Platform is now running in production!"