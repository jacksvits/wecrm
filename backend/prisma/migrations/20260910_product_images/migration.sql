-- Товары: виды (Товар/Услуга), подкатегории, изображения

ALTER TABLE "products" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'product';
ALTER TABLE "products" ADD COLUMN "subcategory" TEXT;

CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "attachment_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
