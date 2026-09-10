-- Опции пользователя: автоподстановка исполнителем/куратором при создании новой задачи
ALTER TABLE "users" ADD COLUMN "default_task_assignee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "default_task_curator" BOOLEAN NOT NULL DEFAULT false;
