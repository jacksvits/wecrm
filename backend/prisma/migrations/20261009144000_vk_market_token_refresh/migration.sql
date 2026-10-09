-- Токены маркета VK теперь выдаются через VK ID (id.vk.ru): access_token живёт ~1 час,
-- поэтому сохраняем refresh_token + device_id для автообновления
ALTER TABLE "vk_group_settings" ADD COLUMN "market_refresh_token" TEXT;
ALTER TABLE "vk_group_settings" ADD COLUMN "market_device_id" TEXT;
ALTER TABLE "vk_group_settings" ADD COLUMN "market_token_expires_at" TIMESTAMP(3);
