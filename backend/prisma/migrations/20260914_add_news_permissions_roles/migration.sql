-- Роли: разрешения на создание и редактирование новостей
ALTER TABLE "roles" ADD COLUMN "can_create_news" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "roles" ADD COLUMN "can_edit_news" BOOLEAN NOT NULL DEFAULT true;
