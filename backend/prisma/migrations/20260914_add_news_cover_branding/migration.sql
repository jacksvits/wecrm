-- Брендинг: обложка новостей по умолчанию (для новостей без своей картинки)
ALTER TABLE "branding" ADD COLUMN "news_cover_path" TEXT;
