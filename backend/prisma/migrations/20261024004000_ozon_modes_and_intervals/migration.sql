-- Режимы синхронизации (направление) для товаров, цен и остатков:
-- 'to_ozon' — из CRM в кабинет OZON (по умолчанию); 'from_ozon' — из кабинета в CRM.
ALTER TABLE "ozon_seller_settings" ADD COLUMN "products_mode" TEXT NOT NULL DEFAULT 'to_ozon';
ALTER TABLE "ozon_seller_settings" ADD COLUMN "prices_mode" TEXT NOT NULL DEFAULT 'to_ozon';
ALTER TABLE "ozon_seller_settings" ADD COLUMN "stocks_mode" TEXT NOT NULL DEFAULT 'to_ozon';
-- Расписание: независимые интервалы авто-синхронизации товаров, цен и остатков (минуты).
ALTER TABLE "ozon_seller_settings" ADD COLUMN "products_interval_minutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "ozon_seller_settings" ADD COLUMN "prices_interval_minutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "ozon_seller_settings" ADD COLUMN "stocks_interval_minutes" INTEGER NOT NULL DEFAULT 60;
-- Перенос прежних настроек: источник остатков и единый интервал
UPDATE "ozon_seller_settings" SET "stocks_mode" = 'from_ozon' WHERE "stock_source" = 'ozon';
UPDATE "ozon_seller_settings" SET "products_interval_minutes" = "update_interval_minutes",
  "prices_interval_minutes" = "update_interval_minutes", "stocks_interval_minutes" = "update_interval_minutes";
ALTER TABLE "ozon_seller_settings" DROP COLUMN "stock_source";
ALTER TABLE "ozon_seller_settings" DROP COLUMN "update_interval_minutes";
