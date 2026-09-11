-- Плагин Псковлайн (провайдер): настройки и произвольное количество аккаунтов-подключений
CREATE TABLE "pskovline_plugin_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "update_time" TEXT NOT NULL DEFAULT '08:00',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pskovline_plugin_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pskovline_plugin_accounts" (
    "id" SERIAL PRIMARY KEY,
    "label" TEXT NOT NULL DEFAULT '',
    "login" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0
);
