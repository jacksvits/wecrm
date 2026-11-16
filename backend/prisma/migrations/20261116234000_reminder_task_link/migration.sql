-- Привязка напоминания к задаче (создано из карточки задачи)
ALTER TABLE "reminders" ADD COLUMN "task_id" TEXT;

ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "reminders_task_id_idx" ON "reminders"("task_id");
