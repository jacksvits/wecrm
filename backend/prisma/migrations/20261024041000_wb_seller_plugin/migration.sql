-- Плагин «WB Seller» (Wildberries): структура зеркально OZON Seller.
-- Опция «WB» вида цен: активный вид цены с флагом for_wb используется плагином
-- при синхронизации цен (вместо розничного вида). Флаг эксклюзивный.
ALTER TABLE "price_types" ADD COLUMN "for_wb" BOOLEAN NOT NULL DEFAULT false;
-- Флаг товара «Товары в WB» и идентификатор карточки WB (nmID)
ALTER TABLE "products" ADD COLUMN "sync_to_wb" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "wb_product_id" BIGINT;
ALTER TABLE "products" ADD COLUMN "wb_synced_at" TIMESTAMPTZ;
-- Настройки плагина WB Seller. По умолчанию всё «С WB» — карточки, цены и остатки
-- вытягиваются из кабинета в складской учёт CRM.
CREATE TABLE "wb_seller_settings" (
  "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "auto_sync" BOOLEAN NOT NULL DEFAULT true,
  "api_key" TEXT NOT NULL DEFAULT '',
  "default_subject_id" INTEGER,
  "products_mode" TEXT NOT NULL DEFAULT 'from_wb',
  "prices_mode" TEXT NOT NULL DEFAULT 'from_wb',
  "stocks_mode" TEXT NOT NULL DEFAULT 'from_wb',
  "products_interval_minutes" INTEGER NOT NULL DEFAULT 60,
  "prices_interval_minutes" INTEGER NOT NULL DEFAULT 60,
  "stocks_interval_minutes" INTEGER NOT NULL DEFAULT 60,
  "stock_warehouse_id" TEXT,
  "last_sync_at" TIMESTAMPTZ,
  "last_sync_result" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
