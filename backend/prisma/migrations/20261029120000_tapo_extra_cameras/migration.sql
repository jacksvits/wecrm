-- Камеры Tapo вне LAN сервера: ручные адреса RTSP (белый IP/проброс портов/VPN)
ALTER TABLE "tapo_plugin_settings" ADD COLUMN "extra_cameras" TEXT NOT NULL DEFAULT '[]';
