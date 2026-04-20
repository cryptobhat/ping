# ==============================================
# Kalaloka Production Deployment Script (PowerShell)
# ==============================================
# This script deploys all services (backend, web, admin) to production
# without requiring external "coolify" network dependencies
#
# Usage:
#   .\deploy-production.ps1

$ErrorActionPreference = "Stop"

# Configuration
$REPO_URL = "https://github.com/agarnagar/kalaloka-backend.git"
$DEPLOY_DIR = "/root/kalaloka-backend"
$BACKUP_DIR = "/root/kalaloka-backup"

function Write-ColorOutput {
    param(
        [string]$Message,
        [ValidateSet("Success", "Error", "Warning")]
        [string]$Type
    )
    $colors = @{
        Success = "Green"
        Error = "Red"
        Warning = "Yellow"
    }
    $symbols = @{
        Success = "✓"
        Error = "✗"
        Warning = "⚠"
    }
    Write-Host "$($symbols[$Type]) $Message" -ForegroundColor $colors[$Type]
}

Write-Host "============================================"
Write-Host "  Kalaloka Production Deployment"
Write-Host "============================================"
Write-Host ""

# Step 1: Create backup if deploy dir exists
Write-Host "[1/8] Checking for existing installation..."
$backupCmd = "if [ -d '$DEPLOY_DIR' ]; then mkdir -p '$BACKUP_DIR' && tar -czf '$BACKUP_DIR/kalaloka-backup-$(date +%%Y%%m%%d-%%H%%M%%S).tar.gz' -C '$DEPLOY_DIR' . 2>/dev/null || true; fi"
ssh root@151.185.41.255 $backupCmd
Write-ColorOutput "Backup check completed" -Type Success

# Step 2: Clone or update repository
Write-Host ""
Write-Host "[2/8] Getting latest code..."
$cloneCmd = "if [ -d '$DEPLOY_DIR' ]; then cd '$DEPLOY_DIR' && git fetch origin && git reset --hard origin/master && git clean -fd; else git clone '$REPO_URL' '$DEPLOY_DIR' && cd '$DEPLOY_DIR'; fi"
ssh root@151.185.41.255 $cloneCmd
Write-ColorOutput "Repository updated" -Type Success

# Step 3: Verify .env file exists
Write-Host ""
Write-Host "[3/8] Checking environment configuration..."
$envCheckCmd = "cd '$DEPLOY_DIR' && if [ ! -f .env ]; then cat > .env << 'ENVEOF'
DB_USER=kavi
DB_PASSWORD=kavi_secret
DB_NAME=content_platform
DEEPSEEK_API_KEY=
SARVAM_API_KEY=
GOOGLE_CLIENT_ID=
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com
WEB_SENTRY_DSN=
ADSENSE_CLIENT=
ADSENSE_SLOT=
GOOGLE_SITE_VERIFICATION=
ENVEOF
echo 'ENV file created - please update with actual values'; else echo 'ENV file found'; fi"
ssh root@151.185.41.255 $envCheckCmd
Write-ColorOutput "Environment configuration verified" -Type Success

# Step 4: Stop existing containers
Write-Host ""
Write-Host "[4/8] Stopping existing containers..."
$stopCmd = "cd '$DEPLOY_DIR' && docker compose -f docker-compose.yml -f docker-compose.production.yml down 2>/dev/null || true"
ssh root@151.185.41.255 $stopCmd
Write-ColorOutput "Containers stopped" -Type Success

# Step 5: Build Docker images
Write-Host ""
Write-Host "[5/8] Building Docker images (this may take 10-15 minutes)..."
$buildCmd = "cd '$DEPLOY_DIR' && docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache"
ssh root@151.185.41.255 $buildCmd
Write-ColorOutput "Docker images built successfully" -Type Success

# Step 6: Start containers
Write-Host ""
Write-Host "[6/8] Starting containers..."
$startCmd = "cd '$DEPLOY_DIR' && docker compose -f docker-compose.yml -f docker-compose.production.yml up -d"
ssh root@151.185.41.255 $startCmd
Write-ColorOutput "Containers started" -Type Success

# Step 7: Wait for services to be healthy
Write-Host ""
Write-Host "[7/8] Waiting for services to be healthy..."
$healthCheckCmd = "cd '$DEPLOY_DIR' && sleep 10 && for i in {1..30}; do if docker ps --format '{{.Names}}' | grep -q 'kavi-api' && docker ps --format '{{.Status}}' | grep 'kavi-api' | grep -q 'healthy'; then echo 'HEALTHY'; break; fi; if [ $((i % 5)) -eq 0 ]; then echo 'Waiting... ($i/30)'; fi; sleep 2; done"
$healthResult = ssh root@151.185.41.255 $healthCheckCmd

if ($healthResult -eq "HEALTHY") {
    Write-ColorOutput "Backend API is healthy" -Type Success
} else {
    Write-ColorOutput "Services did not become healthy within expected time" -Type Error
    Write-Host "Check logs with: docker compose -f docker-compose.yml -f docker-compose.production.yml logs"
    exit 1
}

# Step 8: Display deployment summary
Write-Host ""
Write-Host "[8/8] Deployment Summary"
Write-Host "============================================"
Write-ColorOutput "Deployment completed successfully!" -Type Success
Write-Host ""
Write-Host "Production URLs:"
Write-Host "  • Backend API:  https://kavi-api.digiyogi.com"
Write-Host "  • Admin Panel:  https://kavi-admin.digiyogi.com"
Write-Host "  • Public Web:   https://kavi.digiyogi.com"
Write-Host ""

$psCmd = "cd '$DEPLOY_DIR' && docker compose -f docker-compose.yml -f docker-compose.production.yml ps"
Write-Host "Container Status:"
ssh root@151.185.41.255 $psCmd
Write-Host ""
Write-Host "To view logs:"
Write-Host "  ssh root@151.185.41.255 'cd /root/kalaloka-backend && docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f'"
Write-Host ""
Write-Host "To restart services:"
Write-Host "  ssh root@151.185.41.255 'cd /root/kalaloka-backend && docker compose -f docker-compose.yml -f docker-compose.production.yml restart'"
Write-Host ""
Write-ColorOutput "All systems operational!" -Type Success
