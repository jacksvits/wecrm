-- AlterTable
ALTER TABLE "vk_group_settings" ADD COLUMN IF NOT EXISTS "callback_secret" TEXT;
ALTER TABLE "vk_group_settings" ADD COLUMN IF NOT EXISTS "confirmation_string" TEXT;
