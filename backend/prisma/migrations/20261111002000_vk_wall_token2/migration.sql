-- Пользовательский токен публикации на стене (vk1.a, Standalone, scope wall+photos): фото прикрепляется к посту
ALTER TABLE "vk_community_settings" ADD COLUMN "wall_access_token" TEXT;
