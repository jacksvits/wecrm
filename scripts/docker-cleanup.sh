#!/bin/bash
# Очистка Docker по запросу из backend (файл-канал через смонтированную папку)
# Запуск: cron каждую минуту
REQ="/home/crm/wecrm-platform/backend/data/cleanup-request.json"
RES="/home/crm/wecrm-platform/backend/data/cleanup-result.json"
[ -f "$REQ" ] || exit 0

started=$(date -Iseconds)
df_before=$(docker system df --format '{{.Type}}|{{.Size}}')
docker builder prune -af >/dev/null 2>&1
docker image prune -af >/dev/null 2>&1
df_after=$(docker system df --format '{{.Type}}|{{.Size}}')

python3 - "$started" "$df_before" "$df_after" <<'PYEOF'
import json, sys
def parse(df):
    out = {}
    for line in df.splitlines():
        parts = line.split('|')
        if len(parts) == 2:
            out[parts[0]] = parts[1]
    return out
res = {
    "finishedAt": __import__('datetime').datetime.now().isoformat(),
    "startedAt": sys.argv[1],
    "before": parse(sys.argv[2]),
    "after": parse(sys.argv[3]),
}
open("/home/crm/wecrm-platform/backend/data/cleanup-result.json", "w").write(json.dumps(res, ensure_ascii=False))
PYEOF

rm -f "$REQ"
/home/crm/wecrm-platform/scripts/disk-report.sh >/dev/null 2>&1 || true
