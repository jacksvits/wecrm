-- CreateTable
CREATE TABLE "telegram_user_chat" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_user_chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_user_chat_chat_id_key" ON "telegram_user_chat"("chat_id");

-- AddForeignKey
ALTER TABLE "telegram_user_chat" ADD CONSTRAINT "telegram_user_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_settings" ADD CONSTRAINT "telegram_settings_default_creator_id_fkey" FOREIGN KEY ("default_creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Telegram integration fields (used by telegram-worker processor)
ALTER TABLE "tasks" ADD COLUMN "telegram_message_id" TEXT;
CREATE UNIQUE INDEX "tasks_telegram_message_id_key" ON "tasks"("telegram_message_id");
ALTER TABLE "tasks" ADD COLUMN "telegram_chat_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "telegram_user_id" TEXT;
ALTER TABLE "comments" ADD COLUMN "telegram_message_id" TEXT;
CREATE UNIQUE INDEX "comments_telegram_message_id_key" ON "comments"("telegram_message_id");
ALTER TABLE "contacts" ADD COLUMN "telegram_chat_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN "telegram_user_id" TEXT;
