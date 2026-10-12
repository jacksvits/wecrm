#!/bin/bash
# Отчёт по занятому месту на диске -> JSON (backend/data внутри контейнера)
OUT="/home/crm/wecrm-platform/backend/data/disk-report.json"
PASS='16Fhuevtyn_'

section() {
  local label="$1"; shift
  echo "$PASS" | sudo -S du -xh -d1 "$@" 2>/dev/null | sort -rh | head -10 | awk -v label="$label" '
    BEGIN { printf "{\"label\":\"%s\",\"items\":[", label }
    { size=$1; $1=""; sub(/^ /,""); gsub(/"/,"",$0); printf "%s{\"path\":\"%s\",\"size\":\"%s\"}", (NR>1?",":""), $0, size }
    END { print "]}" }'
}

{
  echo "{\"generatedAt\":\"$(date -Iseconds)\","
  echo -n "\"disk\":["
  df -h / | tail -1 | awk '{printf "{\"mount\":\"%s\",\"size\":\"%s\",\"used\":\"%s\",\"avail\":\"%s\",\"usePct\":\"%s\"}", $6, $2, $3, $4, $5}'
  echo "],"
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
