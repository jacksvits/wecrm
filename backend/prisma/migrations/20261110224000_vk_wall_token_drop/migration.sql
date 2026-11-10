-- Токен публикации на стене не понадобился: постим токеном сообщества, обложка — ссылкой-превью
ALTER TABLE "vk_community_settings" DROP COLUMN IF EXISTS "wall_access_token";
