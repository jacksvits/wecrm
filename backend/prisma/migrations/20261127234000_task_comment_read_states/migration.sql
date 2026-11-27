-- Момент прочтения обсуждения задачи пользователем.
-- Источник для бейджа непрочитанных комментариев в канбане: считаем комментарии
-- задачи с createdAt > lastReadAt (минус свои, для внешних клиентов — минус инкогнито).
CREATE TABLE "task_comment_read_states" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comment_read_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_comment_read_states_task_id_user_id_key" ON "task_comment_read_states"("task_id", "user_id");
CREATE INDEX "task_comment_read_states_user_id_idx" ON "task_comment_read_states"("user_id");

ALTER TABLE "task_comment_read_states" ADD CONSTRAINT "task_comment_read_states_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_comment_read_states" ADD CONSTRAINT "task_comment_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
