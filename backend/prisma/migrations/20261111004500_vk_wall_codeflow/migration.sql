-- Authorization Code Flow для токена публикации (implicit-токены ВК привязаны к IP выдачи и не работают с сервера)
ALTER TABLE "vk_community_settings" ADD COLUMN "wall_app_id" TEXT;
ALTER TABLE "vk_community_settings" ADD COLUMN "wall_app_secret" TEXT;
ALTER TABLE "vk_community_settings" ADD COLUMN "wall_oauth_state" TEXT;