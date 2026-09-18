-- Опция роли «Доступ к проектам»: пользователи роли показываются в списке участников проекта

ALTER TABLE "roles" ADD COLUMN "can_access_projects" BOOLEAN NOT NULL DEFAULT false;

-- Администраторам и менеджерам доступ открыт по умолчанию
UPDATE "roles" SET "can_access_projects" = true WHERE "name" IN ('admin', 'manager');
