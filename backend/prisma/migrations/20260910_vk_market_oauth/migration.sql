-- ВК: OAuth-приложение маркета (App ID + Secure key для серверного получения токена market)

ALTER TABLE "vk_group_settings" ADD COLUMN "market_app_id" INTEGER;
ALTER TABLE "vk_group_settings" ADD COLUMN "market_app_secret" TEXT;
