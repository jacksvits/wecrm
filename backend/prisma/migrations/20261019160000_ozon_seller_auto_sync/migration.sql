-- Опция «Авто синхронизация» плагина OZON Seller: когда выключена,
-- фоновая синхронизация по расписанию (worker) не выполняется.
-- DEFAULT true — прежнее поведение (автосинхронизация включена) сохраняется.
ALTER TABLE "ozon_seller_settings" ADD COLUMN "auto_sync" BOOLEAN NOT NULL DEFAULT true;
