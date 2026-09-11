-- Настройки плагина Beget (хостинг): логин/пароль для парсера, флаг активности
CREATE TABLE "beget_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "login" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beget_settings_pkey" PRIMARY KEY ("id")
);
