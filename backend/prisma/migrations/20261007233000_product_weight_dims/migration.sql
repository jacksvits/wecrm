-- Характеристики товара для выгрузки в OZON: вес (кг) и габариты (см)
ALTER TABLE "products" ADD COLUMN "weight" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN "width" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN "height" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN "depth" DOUBLE PRECISION;
