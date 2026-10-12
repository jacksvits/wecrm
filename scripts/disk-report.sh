#!/bin/bash
# Отчёт по диску и Docker -> JSON (backend/data внутри контейнера)
OUT="/home/crm/wecrm-platform/backend/data/disk-report.json"
PASS='16Fhuevtyn_'
set -e

section() {
  local label="$1"; shift
  echo "$PASS" | sudo -S du -xh -d1 "$@" 2>/dev/null | sort -rh | head -10 | awk -v label="$label" '
    BEGIN { printf "{\"label\":\"%s\",\"items\":[", label }
    { size=$1; $1=""; sub(/^ /,""); gsub(/"/,"",$0); printf "%s{\"path\":\"%s\",\"size\":\"%s\"}", (NR>1?",":""), $0, size }
    END { print "]}" }'
}

docker_json() {
  local running total img_count img_size img_reb vol_count vol_size cache_size cache_reb
  running=$(docker ps -q | wc -l)
  total=$(docker ps -aq | wc -l)
  img_count=$(docker images -q | wc -l)
  local df
  df=$(docker system df --format '{{.Type}}|{{.TotalCount}}|{{.Size}}|{{.Reclaimable}}')
  img_size=$(echo "$df" | awk -F'|' '$1=="Images"{print $3}')
  img_reb=$(echo "$df" | awk -F'|' '$1=="Images"{print $4}')
  vol_count=$(echo "$df" | awk -F'|' '$1=="Local Volumes"{print $2}')
  vol_size=$(echo "$df" | awk -F'|' '$1=="Local Volumes"{print $3}')
  cache_size=$(echo "$df" | awk -F'|' '$1=="Build Cache"{print $3}')
  cache_reb=$(echo "$df" | awk -F'|' '$1=="Build Cache"{print $4}')
  printf '{"containersRunning":%s,"containersTotal":%s,"imagesCount":%s,"imagesSize":"%s","imagesReclaimable":"%s","volumesCount":%s,"volumesSize":"%s","buildCacheSize":"%s","buildCacheReclaimable":"%s"}' \
    "$running" "$total" "$img_count" "$img_size" "$img_reb" "${vol_count:-0}" "$vol_size" "$cache_size" "$cache_reb"
}

{
  echo "{\"generatedAt\":\"$(date -Iseconds)\","
  echo -n "\"disk\":["
  df -h / | tail -1 | awk '{printf "{\"mount\":\"%s\",\"size\":\"%s\",\"used\":\"%s\",\"avail\":\"%s\",\"usePct\":\"%s\"}", $6, $2, $3, $4, $5}'
  echo "],"
  echo -n "\"docker\":"
  docker_json
  echo ","
  echo -n "\"sections\":["
  first=1
  for spec in "Вся система:/" "Docker и контейнеры:/var/lib/docker" "Containerd (образы):/var/lib/containerd" "Логи:/var/log" "Домашние папки:/home" "Программы (snap):/var/lib/snapd" "Приложения:/app"; do
    label="${spec%%:*}"; path="${spec#*:}"
    [ $first -eq 0 ] && echo -n ","
    first=0
    section "$label" "$path"
  done
  echo "]}"
} > "${OUT}.tmp" && mv "${OUT}.tmp" "$OUT"
echo "report written: $OUT"
