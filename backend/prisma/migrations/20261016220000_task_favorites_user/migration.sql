-- Индивидуальные избранные задачи: общее поле tasks.is_favorite заменено
-- на таблицу task_favorites (taskId + userId). Начало «с чистого листа»:
-- прежние общие отметки избранного не переносятся.

CREATE TABLE "task_favorites" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_favorites_taskId_userId_key" ON "task_favorites"("taskId", "userId");
CREATE INDEX "task_favorites_userId_idx" ON "task_favorites"("userId");

ALTER TABLE "task_favorites" ADD CONSTRAINT "task_favorites_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_favorites" ADD CONSTRAINT "task_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "tasks_is_favorite_idx";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "is_favorite";
