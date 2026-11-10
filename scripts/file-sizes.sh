#!/bin/bash
# Размеры файловых томов -> JSON для /api/platform/tenants (страница «Платформа»).
# du по NFS (~170k файлов) занимает ~минуту — считаем по cron, а не в HTTP-запросе.
# Аналог disk-report.sh: пишем в backend/data, который смонтирован в контейнере как /app/data.
OUT="/home/crm/wecrm/backend/data/file-sizes.json"
ROOT="/mnt/nfs/wecrm-uploads"
PASS='16Fhuevtyn_'

main=$(echo "$PASS" | sudo -S du -sb --exclude='tenants' --exclude='backup' --exclude='t-*' "$ROOT" 2>/dev/null | awk 'NR==1{print $1}')

tenants="{"
first=1
for d in "$ROOT"/tenants/*/; do
  [ -d "$d" ] || continue
  slug=$(basename "$d")
  size=$(echo "$PASS" | sudo -S du -sb -d0 "$d" 2>/dev/null | awk 'NR==1{print $1}')
  [ $first -eq 0 ] && tenants+=","
  first=0
  tenants+="\"$slug\":${size:-0}"
done
tenants+="}"

printf '{"generatedAt":"%s","mainFilesBytes":%s,"tenants":%s}\n' "$(date -Iseconds)" "${main:-0}" "$tenants" > "${OUT}.tmp" && mv "${OUT}.tmp" "$OUT"
echo "file-sizes written: $OUT"
