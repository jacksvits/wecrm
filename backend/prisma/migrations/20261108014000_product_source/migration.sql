-- Где создана карточка товара: system | ozon | wb | vk
ALTER TABLE "products" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'system';
