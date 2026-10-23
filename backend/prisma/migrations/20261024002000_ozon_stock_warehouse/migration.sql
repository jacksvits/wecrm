-- Целевой склад CRM для остатков из кабинета OZON (настройка плагина, опция «С OZON»).
-- NULL — прежнее поведение: первый активный склад.
ALTER TABLE "ozon_seller_settings" ADD COLUMN "stock_warehouse_id" TEXT;
