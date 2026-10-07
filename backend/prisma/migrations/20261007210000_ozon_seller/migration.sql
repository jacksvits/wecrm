-- Плагин «OZON Seller»: подключение к API OZON и выгрузка каталога товаров

-- Признаки синхронизации с OZON в карточках товаров
ALTER TABLE "products" ADD COLUMN "sync_to_ozon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "ozon_product_id" INTEGER;
ALTER TABLE "products" ADD COLUMN "ozon_synced_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "products_ozon_product_id_key" ON "products"("ozon_product_id");

-- Настройки подключения плагина
CREATE TABLE "ozon_seller_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "client_id" TEXT NOT NULL DEFAULT '',
    "api_key" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "update_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "last_sync_at" TIMESTAMP(3),
    "last_sync_result" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ozon_seller_settings_pkey" PRIMARY KEY ("id")
);
