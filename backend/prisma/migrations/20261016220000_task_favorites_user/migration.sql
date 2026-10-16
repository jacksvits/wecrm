-- Индивидуальные избранные задачи: общее поле tasks.is_favorite заменено
-- на таблицу task_favorites (taskId + userId). Начало «с чистого листа»:
-- прежние общие отметки избранного не переносятся.

CREATE TABLE "task_favorites" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_favorites_task_id_user_id_key" ON "task_favorites"("task_id", "user_id");
CREATE INDEX "task_favorites_user_id_idx" ON "task_favorites"("user_id");
CREATE INDEX "task_favorites_task_id_user_id_idx" ON "task_favorites"("task_id", "user_id");

ALTER TABLE "task_favorites" ADD CONSTRAINT "task_favorites_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_favorites" ADD CONSTRAINT "task_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "tasks_is_favorite_idx";
ALTER TABLE "tasks" DROP COLUMN "is_favorite";
