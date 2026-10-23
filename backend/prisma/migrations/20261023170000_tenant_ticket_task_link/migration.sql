-- Запросы организаций переносим в задачи платформы (welans.cc):
-- у тикета появляется ссылка task_id на задачу платформенной БД,
-- диалог с организацией дублируется в обсуждении задачи (comments).
-- FK не добавляем: задачи tenant'ов живут в их собственных БД,
-- tenant_tickets — только в платформенной (как author_id у вложений).
ALTER TABLE "tenant_tickets" ADD COLUMN "task_id" TEXT;

CREATE INDEX "tenant_tickets_task_id_idx" ON "tenant_tickets"("task_id");
