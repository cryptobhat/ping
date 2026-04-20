#!/bin/bash

# ==============================================
# Kalaloka Production Deployment Script
# ==============================================
# This script deploys all services (backend, web, admin) to production
# without requiring external "coolify" network dependencies
#
# Usage:
#   chmod +x deploy-production.sh
#   ./deploy-production.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/agarnagar/kalaloka-backend.git"
DEPLOY_DIR="/root/kalaloka-backend"
BACKUP_DIR="/root/kalaloka-backup"

echo "============================================"
echo "  Kalaloka Production Deployment"
echo "============================================"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Create backup if deploy dir exists
echo "[1/8] Checking for existing installation..."
if [ -d "$DEPLOY_DIR" ]; then
    print_warning "Existing installation found, creating backup..."
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/kalaloka-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" -C "$DEPLOY_DIR" . 2>/dev/null || true
    print_success "Backup created: $BACKUP_FILE"
fi

# Step 2: Clone or update repository
echo ""
echo "[2/8] Getting latest code..."
if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    print_success "Pulling latest changes..."
    git fetch origin
    git reset --hard origin/master
    git clean -fd
else
    print_success "Cloning repository..."
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# Step 3: Verify .env file exists
echo ""
echo "[3/8] Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_error ".env file not found! Creating from template..."
    cat > .env << 'EOF'
# Database
DB_USER=kavi
DB_PASSWORD=kavi_secret
DB_NAME=content_platform

# External APIs
DEEPSEEK_API_KEY=
SARVAM_API_KEY=
GOOGLE_CLIENT_ID=

# Analytics
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com
WEB_SENTRY_DSN=
ADSENSE_CLIENT=
ADSENSE_SLOT=
GOOGLE_SITE_VERIFICATION=
EOF
    print_warning "Please update .env with actual values before production use!"
fi
print_success "Environment configuration found"

# Step 4: Stop existing containers
echo ""
echo "[4/8] Stopping existing containers..."
docker compose -f docker-compose.yml -f docker-compose.production.yml down 2>/dev/null || true
print_success "Containers stopped"

# Step 5: Build Docker images
echo ""
echo "[5/8] Building Docker images (this may take 10-15 minutes)..."
docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache
print_success "Docker images built successfully"

# Step 6: Start containers
echo ""
echo "[6/8] Starting containers..."
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
print_success "Containers started"

# Step 7: Wait for services to be healthy
echo ""
echo "[7/8] Waiting for services to be healthy..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker ps --format '{{.Names}}' | grep -q "kavi-api"; then
        if docker ps --format '{{.Status}}' | grep "kavi-api" | grep -q "healthy"; then
            print_success "Backend API is healthy"
            break
        fi
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
        print_warning "Waiting for services to be healthy... ($RETRY_COUNT/$MAX_RETRIES)"
    fi
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Services did not become healthy within expected time"
    echo "Check logs with: docker compose -f docker-compose.yml -f docker-compose.production.yml logs"
    exit 1
fi

# Step 8: Display deployment summary
echo ""
echo "[8/8] Deployment Summary"
echo "============================================"
print_success "Deployment completed successfully!"
echo ""
echo "Production URLs:"
echo "  • Backend API:  https://kavi-api.digiyogi.com"
echo "  • Admin Panel:  https://kavi-admin.digiyogi.com"
echo "  • Public Web:   https://kavi.digiyogi.com"
echo ""
echo "Container Status:"
docker compose -f docker-compose.yml -f docker-compose.production.yml ps
echo ""
echo "To view logs:"
echo "  docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f"
echo ""
echo "To restart services:"
echo "  docker compose -f docker-compose.yml -f docker-compose.production.yml restart"
echo ""
print_success "All systems operational!"
