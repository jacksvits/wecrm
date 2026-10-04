#!/bin/sh
# Запуск VNC-сессии браузера на KasmVNC:
#   PulseAudio (null-sink KasmVNC для захвата звука)
#   → Xvnc :1 (KasmVNC: X-сервер с расширениями видео/аудио, RFB на 5900)
#   → websockify (статика кастомного клиента KasmVNC + WS-мост 6080→5900)
#   → fluxbox → Chromium (весь трафик через VPN-прокси sing-box)
set -e

mkdir -p /data/chrome /data/.config/pulse

# --- PulseAudio: виртуальный sink, с которого KasmVNC забирает звук ---
cat > /data/.config/pulse/default.pa <<'PA'
load-module module-native-protocol-unix
load-module module-null-sink sink_name=KasmVNC sink_properties=device.description=KasmVNC
set-default-sink KasmVNC
PA
pulseaudio --exit-idle-time=-1 --log-level=1 --daemonize
export PULSE_SERVER="unix:/data/.config/pulse/native"

# Заглушка fbsetbg: дефолтный стиль fluxbox зовёт его для обоев и показывает
# xmessage («I can't find an app to set the wallpaper») поверх экрана
printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/fbsetbg
chmod +x /usr/local/bin/fbsetbg

# --- KasmVNC-сервер (X-сервер + RFB с расширениями аудио/видео) ---
# -disableBasicAuth/-SecurityTypes None: аутентификация — на уровне CRM
# (бэкенд пускает к сессии только владельца по JWT/cookie); TLS — на NAS
Xvnc :1 \
  -PublicIP 127.0.0.0 \
  -disableBasicAuth \
  -SecurityTypes None \
  -AlwaysShared \
  -geometry "${SCREEN_W}x${SCREEN_H}" \
  -sslOnly 0 \
  -rfbport 5900 \
  -websocketPort 6082 \
  -interface 0.0.0.0 \
  -Log '*:stdout:10' &

# Ждём готовности Xvnc
for i in $(seq 1 40); do [ -S /tmp/.X11-unix/X1 ] && break; sleep 0.5; done

# Лёгкий оконный менеджер (без него chromium стартует без рамки/фокуса)
fluxbox &

# Снять lock профиля: при пересоздании сессии Singleton* остаются от
# старого контейнера, и Chromium показывает модальный диалог «Unlock Profile»
rm -f /data/chrome/SingletonLock /data/chrome/SingletonSocket /data/chrome/SingletonCookie 2>/dev/null || true

# Настоящий браузер; весь трафик — через уже установленный прокси (sing-box)
chromium \
  --no-sandbox --test-type --disable-gpu --disable-dev-shm-usage \
  --proxy-server="${PROXY_SERVER}" \
  --user-data-dir=/data/chrome \
  --no-first-run --no-default-browser-check --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  --start-maximized \
  --app="${START_URL}" &

# Статика веб-клиента KasmVNC + websocket-мост в RFB (аудио/видео-расширения
# KasmVNC идут внутри RFB-потока — транспорт им безразличен)
exec websockify --web /usr/share/kasmvnc/www 6080 localhost:5900
