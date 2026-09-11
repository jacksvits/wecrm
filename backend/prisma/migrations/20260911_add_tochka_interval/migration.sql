-- Плагин Точка Банк: интервал обновления данных (минуты)
CREATE TABLE "tochka_plugin_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "update_interval_minutes" INTEGER NOT NULL DEFAULT 15,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tochka_plugin_settings_pkey" PRIMARY KEY ("id")
);
