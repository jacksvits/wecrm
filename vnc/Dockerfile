# Сессия VNC-браузера: настоящий Chromium на виртуальном дисплее KasmVNC.
# KasmVNC: видео (WebCodecs/H.264) и звук (Opus через PulseAudio) прямо в
# браузере по WebSocket, плавнее картинка, чем у классического VNC.
# Собирается вручную: docker compose --profile manual build vnc-session
# Образ используется бэкендом (routes/browser-vnc.ts) — контейнер поднимается
# по сессии на каждого пользователя CRM через docker-сокет.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1 \
    SCREEN_W=1280 \
    SCREEN_H=800 \
    PROXY_SERVER=http://vpn:2080 \
    START_URL=https://google.com \
    HOME=/data

# chromium — браузер, fluxbox — лёгкий WM, pulseaudio — захват звука
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends \
      chromium fluxbox pulseaudio websockify \
      fonts-liberation fonts-dejavu-core ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

# KasmVNC 1.5.0 (официальный .deb, ветка bookworm совместима с debian:bookworm)
ARG KASMVNC_VER=1.5.0
RUN wget -q "https://github.com/kasmtech/KasmVNC/releases/download/v${KASMVNC_VER}/kasmvncserver_bookworm_${KASMVNC_VER}_amd64.deb" -O /tmp/kasmvnc.deb \
    && apt-get update -qq && apt-get install -y -qq /tmp/kasmvnc.deb \
    && rm -f /tmp/kasmvnc.deb && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# /data — профиль Chromium (сессии сайтов сохраняются), конфиги WM и pulse;
# бэкенд монтирует сюда vnc-data/<userId> (персистентно, на диске сервера)
VOLUME /data
EXPOSE 6080

ENTRYPOINT ["/entrypoint.sh"]
