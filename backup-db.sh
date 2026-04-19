#!/bin/bash
# Daily PostgreSQL backup → E2E Object Storage
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)
BACKUP_FILE="/tmp/kavi-db-${TIMESTAMP}.sql.gz"
S3_PATH="s3://digiyogi/backups/daily/kavi-db-${TIMESTAMP}.sql.gz"

# Dump database
docker exec kavi-db pg_dump -U kavi -d content_platform --no-owner --no-acl | gzip > "${BACKUP_FILE}"

# Upload to S3
docker run --rm -e MC_HOST_e2e="https://Q5HXGD55T36HCNF5XZYE:D9PGRYQ4AL1WIY3M653HCT9IIMF8J1FQEI7YVLR2@in-south1-objectstore.e2enetworks.net" -v /tmp:/tmp minio/mc cp "${BACKUP_FILE}" e2e/digiyogi/backups/daily/

# Weekly backup (every Sunday)
if [ "${DAY_OF_WEEK}" = "7" ]; then
  docker run --rm -e MC_HOST_e2e="https://Q5HXGD55T36HCNF5XZYE:D9PGRYQ4AL1WIY3M653HCT9IIMF8J1FQEI7YVLR2@in-south1-objectstore.e2enetworks.net" -v /tmp:/tmp minio/mc cp "${BACKUP_FILE}" e2e/digiyogi/backups/weekly/
fi

# Cleanup local file
rm -f "${BACKUP_FILE}"

# Delete daily backups older than 7 days (keep weekly)
docker run --rm -e MC_HOST_e2e="https://Q5HXGD55T36HCNF5XZYE:D9PGRYQ4AL1WIY3M653HCT9IIMF8J1FQEI7YVLR2@in-south1-objectstore.e2enetworks.net" minio/mc find e2e/digiyogi/backups/daily/ --older-than 7d --exec "mc rm {}" 2>/dev/null || true

echo "[$(date)] Backup complete: ${BACKUP_FILE}"
