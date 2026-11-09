-- Поля для идемпотентного импорта новостей старого WordPress-сайта.
ALTER TABLE "news" ADD COLUMN "source_url" TEXT;
ALTER TABLE "news" ADD COLUMN "external_id" INTEGER;

CREATE UNIQUE INDEX "news_external_id_key" ON "news"("external_id");
