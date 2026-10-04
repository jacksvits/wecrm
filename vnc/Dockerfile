# Сессия VNC-браузера: настоящий Chromium на виртуальном дисплее + noVNC.
# Собирается вручную: docker compose --profile manual build vnc-session
# Образ используется бэкендом (routes/browser-vnc.ts) — он поднимает контейнер
# по сессии на каждого пользователя CRM через docker-сокет.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:0 \
    SCREEN_W=1280 \
    SCREEN_H=800 \
    PROXY_SERVER=http://vpn:2080 \
    START_URL=https://google.com \
    HOME=/data

# chromium — браузер, xvfb — виртуальный дисплей, x11vnc — VNC-сервер,
# novnc + websockify — веб-клиент и websocket-мост, fluxbox — лёгкий WM
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends \
      chromium xvfb x11vnc fluxbox novnc websockify \
      fonts-liberation fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# /data — профиль Chromium (сессии сайтов сохраняются) и конфиги WM;
# бэкенд монтирует сюда vnc-data/<userId> (персистентно, на диске сервера)
VOLUME /data
EXPOSE 6080

ENTRYPOINT ["/entrypoint.sh"]
