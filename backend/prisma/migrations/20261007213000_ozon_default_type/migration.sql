-- Плагин «OZON Seller»: категория OZON (type_id) по умолчанию для новых товаров
ALTER TABLE "ozon_seller_settings" ADD COLUMN "default_type_id" INTEGER;
