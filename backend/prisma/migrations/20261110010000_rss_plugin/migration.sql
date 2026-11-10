-- Плагин «Парсинг RSS»: настройки и источники RSS-лент (механика WP RSS Aggregator).
CREATE TABLE "rss_settings" (
    "id" SERIAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "interval_minutes" INTEGER NOT NULL DEFAULT 15,
    "max_items_per_feed" INTEGER NOT NULL DEFAULT 200,
    "limit_per_import" INTEGER NOT NULL DEFAULT 0,
    "unique_titles" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "last_sync_result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rss_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rss_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "site_url" TEXT,
    "feed_image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "settings_id" INTEGER,

    CONSTRAINT "rss_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rss_sources_url_key" ON "rss_sources"("url");
CREATE INDEX "rss_sources_settings_id_idx" ON "rss_sources"("settings_id");

ALTER TABLE "rss_sources" ADD CONSTRAINT "rss_sources_settings_id_fkey"
    FOREIGN KEY ("settings_id") REFERENCES "rss_settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
