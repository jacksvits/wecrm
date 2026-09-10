-- ВК: пользовательский токен с правом market для импорта/синхронизации товаров маркета

ALTER TABLE "vk_group_settings" ADD COLUMN "market_token" TEXT;
