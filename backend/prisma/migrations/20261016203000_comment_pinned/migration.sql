-- Обсуждения задач: закрепление сообщений звёздочкой (дублируются блоком сверху)

ALTER TABLE "comments" ADD COLUMN "pinned_at" TIMESTAMP(3);

CREATE INDEX "comments_task_id_pinned_at_idx" ON "comments"("taskId", "pinned_at");
