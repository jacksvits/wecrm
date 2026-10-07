-- Перевод единиц характеристик: вес в граммах, габариты в миллиметрах (как в OZON)
UPDATE "products" SET "weight" = "weight" * 1000 WHERE "weight" IS NOT NULL;
UPDATE "products" SET "width" = "width" * 10 WHERE "width" IS NOT NULL;
UPDATE "products" SET "height" = "height" * 10 WHERE "height" IS NOT NULL;
UPDATE "products" SET "depth" = "depth" * 10 WHERE "depth" IS NOT NULL;
