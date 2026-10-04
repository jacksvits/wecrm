#!/bin/sh
# Запуск VNC-сессии браузера: Xvfb → fluxbox → chromium (через VPN-прокси)
# → x11vnc → websockify/noVNC на 0.0.0.0:6080
set -e

mkdir -p /data/chrome

# Виртуальный дисплей
Xvfb :0 -screen 0 "${SCREEN_W}x${SCREEN_H}x24" &
for i in $(seq 1 40); do [ -S /tmp/.X11-unix/X0 ] && break; sleep 0.5; done

# Заглушка fbsetbg: дефолтный стиль fluxbox зовёт его для обоев и показывает
# xmessage («I can't find an app to set the wallpaper») поверх экрана. Обои
# на виртуальном дисплее не нужны — молча ничего не делаем.
printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/fbsetbg
chmod +x /usr/local/bin/fbsetbg

# Лёгкий оконный менеджер (без него chromium стартует без рамки/фокуса)
fluxbox &

# Снять lock профиля: при пересоздании сессии Singleton* остаются от
# старого контейнера, и Chromium показывает модальный диалог «Unlock Profile»
rm -f /data/chrome/SingletonLock /data/chrome/SingletonSocket /data/chrome/SingletonCookie 2>/dev/null || true

# Настоящий браузер; весь трафик — через уже установленный прокси (sing-box)
chromium \
  --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --proxy-server="${PROXY_SERVER}" \
  --user-data-dir=/data/chrome \
  --no-first-run --no-default-browser-check --disable-session-crashed-bubble \
  --start-maximized \
  --app="${START_URL}" &

# VNC-сервер (доступен только внутри контейнера, снаружи — через websockify)
x11vnc -display :0 -forever -shared -nopw -rfbport 5900 -quiet -bg

# noVNC: статика веб-клиента + websocket-мост 6080 -> 5900
exec websockify --web /usr/share/novnc 6080 localhost:5900
