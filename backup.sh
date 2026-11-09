#!/bin/bash
# WeCRM Backup Script (мультитенантный)
# - Бэкапит платформенную БД PostgreSQL (wecrm) и каждую БД организации (wecrm_t_*)
# - Если запущен архив old_site, дополнительно бэкапит его MySQL-дамп
# - Ротация: base — 7 дней, download — 30 дней
# Использование: backup.sh [base|download]   (по умолчанию base)

MODE="${1:-base}"
BACKUP_DIR="/mnt/nfs/wecrm-uploads/backup/${MODE}"
DB_USER="crm"
MAIN_DB="wecrm"
CONTAINER="wecrm-db-1"
RETENTION_DAYS=7
[ "$MODE" = "download" ] && RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

dump_db() {
  local db="$1"
  local date_suffix
  date_suffix=$(date +%Y%m%d_%H%M%S)
  local file="${BACKUP_DIR}/${db}_backup_${date_suffix}.sql"
  echo "[$(date)] Backup ${db}..."
  if docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" -d "${db}" --no-owner --no-privileges > "${file}"; then
    gzip "${file}"
    echo "[$(date)] OK: ${file}.gz"
  else
    echo "[$(date)] FAILED: ${db}"
    rm -f "${file}"
    return 1
  fi
}

# Платформенная БД (главная организация + реестр tenant'ов)
dump_db "${MAIN_DB}" || exit 1

# Базы данных организаций
TENANT_DBS=$(docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${MAIN_DB}" -tAc \
  "SELECT datname FROM pg_database WHERE datname LIKE 'wecrm_t\_%' ORDER BY datname")

for db in ${TENANT_DBS}; do
  dump_db "${db}" || echo "[$(date)] WARNING: бэкап ${db} не выполнен"
done

# Архив новостей старого сайта (MySQL). Пароль root читается внутри контейнера
# и не появляется в аргументах mysqldump/логах хоста.
OLD_SITE_CONTAINER="wecrm-old-site-db-1"
if docker ps --format '{{.Names}}' | grep -qx "${OLD_SITE_CONTAINER}"; then
  OLD_SITE_FILE="${BACKUP_DIR}/old_site_backup_$(date +%Y%m%d_%H%M%S).sql"
  echo "[$(date)] Backup old_site (MySQL)..."
  if docker exec "${OLD_SITE_CONTAINER}" sh -c \
    'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --routines --triggers old_site' \
    > "${OLD_SITE_FILE}" 2>/dev/null; then
    gzip "${OLD_SITE_FILE}"
    echo "[$(date)] OK: ${OLD_SITE_FILE}.gz"
  else
    echo "[$(date)] FAILED: old_site"
    rm -f "${OLD_SITE_FILE}"
    exit 1
  fi
fi

# Ротация
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*_backup_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date)] Backups in ${BACKUP_DIR}:"
ls -lh "${BACKUP_DIR}" | tail -20
