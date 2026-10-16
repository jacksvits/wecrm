-- Отметка «Избранное» у задач (личная метка пользователя)

ALTER TABLE "tasks" ADD COLUMN "is_favorite" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "tasks_is_favorite_idx" ON "tasks"("is_favorite");
