-- product_id в OZON превышает 2^31 — перевод в BIGINT
ALTER TABLE "products" ALTER COLUMN "ozon_product_id" TYPE BIGINT;
