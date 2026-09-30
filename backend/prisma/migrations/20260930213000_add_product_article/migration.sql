-- Внутренний 8-значный артикул номенклатуры
ALTER TABLE "products" ADD COLUMN "article" TEXT;

-- Уникальный индекс (NULL-значения не конфликтуют в Postgres)
CREATE UNIQUE INDEX "products_article_key" ON "products"("article");
