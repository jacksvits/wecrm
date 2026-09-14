-- Права доступа: разрешение смены статуса задач и список доступных для назначения статусов
ALTER TABLE "roles" ADD COLUMN "can_change_task_status" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "roles" ADD COLUMN "allowed_task_statuses" TEXT[] NOT NULL DEFAULT '{}';
