-- Таблица настроек плагина «Контур.Диадок» (ЭДО: получение, отправка и подписание документов)
CREATE TABLE "diadoc_plugin_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "login" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "api_key" TEXT NOT NULL DEFAULT '',
    "box_id" TEXT NOT NULL DEFAULT '',
    "box_name" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "update_interval_minutes" INTEGER NOT NULL DEFAULT 15,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diadoc_plugin_settings_pkey" PRIMARY KEY ("id")
);
