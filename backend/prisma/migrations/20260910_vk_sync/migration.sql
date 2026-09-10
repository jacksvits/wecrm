-- Товары: синхронизация с ВКонтакте (отметка «ВК» + ID позиции в маркете ВК)

ALTER TABLE "products" ADD COLUMN "sync_to_vk" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "vk_item_id" INTEGER;
CREATE UNIQUE INDEX "products_vk_item_id_key" ON "products"("vk_item_id");
