-- Дерево категорий товаров из 1С (группы и виды номенклатуры), привязка товаров

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "onec_id" TEXT,
    "name" TEXT NOT NULL,
    "is_group" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_onec_id_key" ON "product_categories"("onec_id");
CREATE INDEX "product_categories_parent_id_idx" ON "product_categories"("parent_id");

-- AddForeignKey (self-relation)
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn + FK + index on products
ALTER TABLE "products" ADD COLUMN "category_id" TEXT;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
