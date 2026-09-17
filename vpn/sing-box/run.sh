#!/bin/sh
# Обёртка sing-box: держит процесс запущенным и перезапускает его,
# когда бэкенд перезаписывает config.json (сохранение настроек плагина
# «Прокси через VPN»). Конфиг лежит в общем томе ./vpn/sing-box.
while true; do
  if [ -f /etc/sing-box/config.json ]; then
    sing-box run -c /etc/sing-box/config.json &
    PID=$!
    OLD=$(md5sum /etc/sing-box/config.json | awk '{print $1}')
    while kill -0 $PID 2>/dev/null; do
      sleep 10
      if [ ! -f /etc/sing-box/config.json ]; then
        break
      fi
      NEW=$(md5sum /etc/sing-box/config.json | awk '{print $1}')
      if [ "$NEW" != "$OLD" ]; then
        echo "[vpn] config.json изменён — перезапуск sing-box"
        kill $PID 2>/dev/null
        break
      fi
    done
    wait $PID 2>/dev/null
  else
    echo "[vpn] config.json не найден — ждём..."
    sleep 30
  fi
done
