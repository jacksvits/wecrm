-- Роль: доступ к чату тех. поддержки; Задача: владелец обращения в поддержку
ALTER TABLE "roles" ADD COLUMN "can_access_support_chat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "support_owner_id" TEXT;
CREATE INDEX "tasks_support_owner_id_idx" ON "tasks"("support_owner_id");
