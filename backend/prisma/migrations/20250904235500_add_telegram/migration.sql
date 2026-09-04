-- Add Telegram fields to existing tables
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "telegram_chat_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "telegram_user_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_telegram_chat_id_key" ON "contacts"("telegram_chat_id");

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "telegram_chat_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "telegram_user_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "telegram_message_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_telegram_message_id_key" ON "tasks"("telegram_message_id");

ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "telegram_message_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "comments_telegram_message_id_key" ON "comments"("telegram_message_id");

-- Create TelegramSettings table
CREATE TABLE IF NOT EXISTS "telegram_settings" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "bot_token" TEXT NOT NULL,
    "chat_id" TEXT,
    "bot_username" TEXT,
    "webhook_url" TEXT,
    "auto_notify" BOOLEAN NOT NULL DEFAULT true,
    "notify_on" TEXT[] DEFAULT ARRAY['task','comment'],
    "default_creator_id" TEXT,
    "assignee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "auto_create_contact" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "telegram_settings_default_creator_id_fkey" 
        FOREIGN KEY ("default_creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create TelegramUserChat table
CREATE TABLE IF NOT EXISTS "telegram_user_chats" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_user_chats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "telegram_user_chats_chat_id_key" UNIQUE ("chat_id"),
    CONSTRAINT "telegram_user_chats_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "telegram_user_chats_user_id_idx" ON "telegram_user_chats"("user_id");
