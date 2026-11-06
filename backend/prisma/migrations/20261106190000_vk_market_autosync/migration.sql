-- Добавление авто-синхронизации ВК Маркета (интервалы, режимы, результат последней синхронизации)
ALTER TABLE "vk_market_settings"
  ADD COLUMN "auto_sync" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "products_mode" VARCHAR(20) NOT NULL DEFAULT 'to_vk',
  ADD COLUMN "prices_mode" VARCHAR(20) NOT NULL DEFAULT 'to_vk',
  ADD COLUMN "stocks_mode" VARCHAR(20) NOT NULL DEFAULT 'to_vk',
  ADD COLUMN "products_interval_minutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "prices_interval_minutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "stocks_interval_minutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "last_sync_at" TIMESTAMP,
  ADD COLUMN "last_sync_result" TEXT;
