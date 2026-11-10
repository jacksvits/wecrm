-- Публикация новостей на стене группы ВК (плагин «ВК сообщество»)
ALTER TABLE "news" ADD COLUMN "vk_post_id" INTEGER;
ALTER TABLE "news" ADD COLUMN "vk_published_at" TIMESTAMP(3);
ALTER TABLE "news" ADD COLUMN "vk_publish_error" TEXT;
