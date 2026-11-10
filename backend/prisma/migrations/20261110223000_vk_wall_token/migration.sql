-- Токен публикации на стене (классический пользовательский, offline) — без него посты уходят текстом без фото
ALTER TABLE "vk_community_settings" ADD COLUMN "wall_access_token" TEXT;
