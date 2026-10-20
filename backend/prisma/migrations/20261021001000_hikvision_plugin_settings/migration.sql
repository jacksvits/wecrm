-- Плагин «Камеры Hik-Connect»: учётные данные облачного аккаунта.
-- Страница камер доступна только администраторам и только при is_active = true.

CREATE TABLE "hikvision_plugin_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "login" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "api_base_url" TEXT NOT NULL DEFAULT 'https://api.hik-connect.com',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hikvision_plugin_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "hikvision_plugin_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
