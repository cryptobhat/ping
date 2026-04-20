#!/bin/bash
# Quick deployment script for production server
# Run this on the production server (151.185.41.255)

set -e

echo "=== Kalaloka Quick Deploy ==="
echo ""

# Stop existing
echo "Stopping existing containers..."
cd /root/kalaloka-backend
docker compose -f docker-compose.yml -f docker-compose.production.yml down || true

# Pull latest
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/master
git clean -fd

# Build and start
echo "Building and starting containers..."
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build

# Wait for health
echo "Waiting for API health..."
sleep 15
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✓ API is healthy!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Show status
echo ""
echo "Container status:"
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

echo ""
echo "=== Deploy complete ==="
echo "URLs:"
echo "  API:   https://kavi-api.digiyogi.com"
echo "  Admin: https://kavi-admin.digiyogi.com"
echo "  Web:   https://kavi.digiyogi.com"
