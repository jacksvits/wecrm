-- Источник остатков при синхронизации плагина OZON Seller:
-- 'warehouse' — остатки выгружаются из складского учёта CRM в кабинет OZON (прежнее поведение);
-- 'ozon' — остатки забираются из кабинета OZON и сохраняются в складской учёт CRM.
ALTER TABLE "ozon_seller_settings" ADD COLUMN "stock_source" TEXT NOT NULL DEFAULT 'warehouse';
