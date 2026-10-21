-- Часовой пояс пользователя (настройка в профиле) + начало срока задачи
-- (автозаполняется датой/временем создания задачи)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
