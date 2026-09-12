-- Опция «Автоматические ответы» в плагинах MAX, Telegram, ВК Группа
ALTER TABLE "max_settings" ADD COLUMN "auto_reply" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "telegram_settings" ADD COLUMN "auto_reply" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vk_group_settings" ADD COLUMN "auto_reply" BOOLEAN NOT NULL DEFAULT false;
