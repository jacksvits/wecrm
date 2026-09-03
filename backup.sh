#!/bin/bash
# WeCRM PostgreSQL Backup Script
# Runs daily at 01:00, keeps 7 days of backups

BACKUP_DIR="/mnt/nfs/wecrm-uploads/backup/base"
DB_NAME="wecrm"
DB_USER="crm"
CONTAINER="wecrm-db-1"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/wecrm_backup_${DATE}.sql"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump inside Docker container
echo "[$(date)] Starting backup..."
docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-privileges > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "${BACKUP_FILE}"
    echo "[$(date)] Backup OK: ${BACKUP_FILE}.gz"
else
    echo "[$(date)] Backup FAILED"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Delete backups older than 7 days
echo "[$(date)] Cleaning up backups older than 7 days..."
find "${BACKUP_DIR}" -name "wecrm_backup_*.sql.gz" -type f -mtime +7 -delete

# List remaining backups
echo "[$(date)] Remaining backups:"
ls -lh "${BACKUP_DIR}"
