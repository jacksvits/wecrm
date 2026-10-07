-- Привязка категорий каталога к категориям OZON (type_id) — с наследованием от родителя
ALTER TABLE "product_categories" ADD COLUMN "ozon_type_id" INTEGER;
