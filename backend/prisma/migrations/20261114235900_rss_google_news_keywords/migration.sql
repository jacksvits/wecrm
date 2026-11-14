-- Плагин «Парсинг RSS»: ключевые слова Google News + сводка последнего обхода.
-- Ключевые слова свои у каждого тенанта (rss_settings живёт в БД каждой организации).

ALTER TABLE "rss_settings" ADD COLUMN "google_news_keywords" TEXT;
ALTER TABLE "rss_settings" ADD COLUMN "last_google_news_sync_at" TIMESTAMP(3);
ALTER TABLE "rss_settings" ADD COLUMN "last_google_news_sync_result" TEXT;
