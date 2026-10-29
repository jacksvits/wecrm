-- Плагин «Камеры Tapo» (TP-Link): учётные данные облачного аккаунта TP-Link ID.
-- Страница камер доступна только администраторам и только при is_active = true.
-- Видео идёт как H.264 в fMP4 (MSE) напрямую с камер по RTSP, список камер —
-- из облака TP-Link (сопоставление устройств с LAN сервера по MAC).

CREATE TABLE "tapo_plugin_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "login" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tapo_plugin_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "tapo_plugin_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
