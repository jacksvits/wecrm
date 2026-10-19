-- Плагин «ВК Группа» разделён на три независимых плагина:
-- «ВК авторизация» (vk_auth_settings), «ВК товары» (vk_market_settings),
-- «ВК сообщество» (vk_community_settings). Настройки переносим из vk_group_settings,
-- затем старую таблицу удаляем.

CREATE TABLE "vk_auth_settings" (
    "id" TEXT NOT NULL,
    "app_id" INTEGER,
    "client_secret" TEXT,
    "redirect_uri" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vk_auth_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vk_market_settings" (
    "id" TEXT NOT NULL,
    "group_id" INTEGER NOT NULL,
    "market_token" TEXT,
    "market_refresh_token" TEXT,
    "market_device_id" TEXT,
    "market_token_expires_at" TIMESTAMP(3),
    "market_app_id" INTEGER,
    "market_app_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vk_market_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vk_community_settings" (
    "id" TEXT NOT NULL,
    "group_id" INTEGER NOT NULL,
    "access_token" TEXT NOT NULL,
    "default_creator_id" TEXT,
    "assignee_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "auto_create_contact" BOOLEAN NOT NULL DEFAULT true,
    "auto_reply" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_ts" INTEGER,
    "callback_secret" TEXT,
    "confirmation_string" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vk_community_settings_pkey" PRIMARY KEY ("id")
);

-- FK на пользователя-автора задач (как в старой таблице)
ALTER TABLE "vk_community_settings" ADD CONSTRAINT "vk_community_settings_default_creator_id_fkey"
    FOREIGN KEY ("default_creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Индексы аналогично старым запросам findFirst({ where: { groupId } })
CREATE INDEX "vk_community_settings_group_id_idx" ON "vk_community_settings"("group_id");

-- Перенос настроек сообщества (вебхук, задачи, авторепост)
INSERT INTO "vk_community_settings" (
    "id", "group_id", "access_token", "default_creator_id", "assignee_ids",
    "auto_create_contact", "auto_reply", "is_active", "last_ts",
    "callback_secret", "confirmation_string", "created_at", "updated_at"
)
SELECT
    gen_random_uuid()::text, "group_id", "access_token", "default_creator_id", "assignee_ids",
    "auto_create_contact", "auto_reply", "is_active", "last_ts",
    "callback_secret", "confirmation_string", "created_at", "updated_at"
FROM "vk_group_settings";

-- Перенос настроек маркета (токены, приложение маркета)
INSERT INTO "vk_market_settings" (
    "id", "group_id", "market_token", "market_refresh_token", "market_device_id",
    "market_token_expires_at", "market_app_id", "market_app_secret",
    "is_active", "created_at", "updated_at"
)
SELECT
    gen_random_uuid()::text, "group_id", "market_token", "market_refresh_token", "market_device_id",
    "market_token_expires_at", "market_app_id", "market_app_secret",
    "is_active", "created_at", "updated_at"
FROM "vk_group_settings"
WHERE "market_token" IS NOT NULL OR "market_app_id" IS NOT NULL;

-- Перенос настроек авторизации: у плагина «ВК Группа» своих полей авторизации не было
-- (использовались переменные окружения VK_CLIENT_ID/VK_CLIENT_SECRET), поэтому создаём
-- запись только там, где ВК вообще был настроен, — is_active сохраняет прежнее поведение.
INSERT INTO "vk_auth_settings" ("id", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "is_active", "created_at", "updated_at"
FROM "vk_group_settings"
LIMIT 1;

-- Старый плагин удалён полностью
DROP TABLE "vk_group_settings";
