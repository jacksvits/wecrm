#!/bin/bash
# Генерация baseline для provisioning новых организаций (tenant'ов).
# Снапшотит схему платформенной БД вместе с историей _prisma_migrations.
# Запускать после каждого деплоя с новыми миграциями: ./scripts/gen-tenant-baseline.sh
# ВАЖНО: данные _prisma_migrations дампим через --inserts — встроенные данные
# COPY (FROM stdin) невозможно выполнить через один simple query protocol.
set -e
CONTAINER="wecrm-db-1"
DB="wecrm"
OUT="$(dirname "$0")/../backend/prisma/tenant-baseline.sql"

docker exec "${CONTAINER}" sh -c \
  "pg_dump -U crm --schema-only --no-owner --no-privileges ${DB} && pg_dump -U crm --data-only --inserts --table=_prisma_migrations --no-owner --no-privileges ${DB}" \
  > "${OUT}"

echo "Baseline written: ${OUT} ($(wc -l < "${OUT}") lines)"
