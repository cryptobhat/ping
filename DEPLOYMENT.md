# Kalaloka Production Deployment

This directory contains deployment scripts for the Kalaloka platform without external "coolify" network dependencies.

## Problem Solved

The main `docker-compose.yml` references an external "coolify" network that requires docker.io access and fails in environments without it. The `docker-compose.production.yml` override removes this dependency.

## Files

- **`docker-compose.production.yml`** - Production Docker Compose override (removes external network)
- **`deploy-production.sh`** - Bash deployment script for Linux/Unix servers
- **`deploy-production.ps1`** - PowerShell deployment script for Windows clients
- **`DEPLOYMENT.md`** - This file

## Quick Deployment

### From Windows (using PowerShell)

```powershell
# Run from kalaloka-backend directory
.\deploy-production.ps1
```

### From Linux Server (SSH)

```bash
# Copy script to server first
scp deploy-production.sh root@151.185.41.255:/root/

# SSH into server and run
ssh root@151.185.41.255
chmod +x /root/deploy-production.sh
/root/deploy-production.sh
```

### Manual Deployment Steps

```bash
# 1. SSH into production server
ssh root@151.185.41.255

# 2. Navigate to deployment directory
cd /root/kalaloka-backend

# 3. Pull latest code
git fetch origin
git reset --hard origin/master

# 4. Stop existing containers
docker compose -f docker-compose.yml -f docker-compose.production.yml down

# 5. Build new images (takes 10-15 minutes)
docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache

# 6. Start containers
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d

# 7. Check status
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

# 8. View logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f
```

## Environment Variables

Required variables in `.env` file:

```bash
# Database
DB_USER=kavi
DB_PASSWORD=kavi_secret
DB_NAME=content_platform

# External APIs (optional for basic functionality)
DEEPSEEK_API_KEY=
SARVAM_API_KEY=
GOOGLE_CLIENT_ID=

# Analytics (optional)
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com
WEB_SENTRY_DSN=
ADSENSE_CLIENT=
ADSENSE_SLOT=
GOOGLE_SITE_VERIFICATION=
```

## Services

After deployment, the following URLs will be available:

- **Backend API:** https://kavi-api.digiyogi.com
- **Admin Panel:** https://kavi-admin.digiyogi.com
- **Public Website:** https://kavi.digiyogi.com

## Troubleshooting

### Containers not starting

```bash
# Check Docker logs
docker compose -f docker-compose.yml -f docker-compose.production.yml logs

# Check specific container logs
docker logs kavi-api
docker logs kavi-admin
docker logs kavi-web
```

### Database connection issues

```bash
# Check PostgreSQL container
docker logs kavi-db

# Restart database
docker restart kavi-db
```

### Health check failing

```bash
# Manual health check
curl http://localhost:3000/health

# Check container status
docker ps -a
```

### Rebuild specific service

```bash
# Rebuild only backend
docker compose -f docker-compose.yml -f docker-compose.production.yml build kavi-api
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d kavi-api

# Rebuild only web
docker compose -f docker-compose.yml -f docker-compose.production.yml build kavi-web
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d kavi-web
```

## Backup & Restore

### Create backup

```bash
# Backup entire deployment
tar -czf /root/kalaloka-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C /root/kalaloka-backend .

# Backup database only
docker exec kavi-db pg_dump -U kavi content_platform > backup.sql
```

### Restore from backup

```bash
# Restore entire deployment
tar -xzf /root/kalaloka-backup-YYYYMMDD-HHMMSS.tar.gz -C /root/

# Restore database
cat backup.sql | docker exec -i kavi-db psql -U kavi content_platform
```

## Monitoring

### Check service health

```bash
# All containers status
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

# Container resource usage
docker stats

# Database connections
docker exec kavi-db psql -U kavi content_platform -c "SELECT count(*) FROM pg_stat_activity;"
```

### View real-time logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f

# Specific service
docker logs -f kavi-api
```

## Security Notes

1. **Never commit** `.env` file to version control
2. **Change default passwords** in production (DB_PASSWORD)
3. **Use strong secrets** for webhook/API keys
4. **Enable firewall** - only expose necessary ports (80, 443)
5. **Regular updates** - keep Docker images and base OS updated
6. **Backups** - set up automated backups of database and uploads

## Next Steps After Deployment

1. Test all production URLs:
   - https://kavi-api.digiyogi.com/health
   - https://kavi-admin.digiyogi.com
   - https://kavi.digiyogi.com

2. Configure domain DNS to point to server IP (151.185.41.255)

3. Setup SSL certificates (Traefik auto-generates with Let's Encrypt)

4. Configure monitoring/alerts for production services

5. Set up automated backups

## Support

For issues or questions:
- Check Docker logs: `docker logs <container_name>`
- Check Traefik dashboard (if enabled)
- Review this deployment guide
