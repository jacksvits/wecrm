-- Статусы: опция «Авто смена» — через N минут сущность автоматически переходит в целевой статус.
-- Сущности: фиксация времени входа в текущий статус (status/stage/statusId).

ALTER TABLE "statuses" ADD COLUMN "auto_change_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "statuses" ADD COLUMN "auto_change_minutes" INTEGER;
ALTER TABLE "statuses" ADD COLUMN "auto_change_to_status_id" TEXT;

ALTER TABLE "statuses" ADD CONSTRAINT "statuses_auto_change_to_status_id_fkey" FOREIGN KEY ("auto_change_to_status_id") REFERENCES "statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "statuses_auto_change_enabled_idx" ON "statuses"("auto_change_enabled");

ALTER TABLE "tasks" ADD COLUMN "status_changed_at" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "status_changed_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "status_changed_at" TIMESTAMP(3);
ALTER TABLE "reminders" ADD COLUMN "status_changed_at" TIMESTAMP(3);

CREATE INDEX "tasks_status_changed_at_idx" ON "tasks"("status_changed_at");
CREATE INDEX "projects_status_changed_at_idx" ON "projects"("status_changed_at");
CREATE INDEX "deals_status_changed_at_idx" ON "deals"("status_changed_at");
CREATE INDEX "reminders_status_changed_at_idx" ON "reminders"("status_changed_at");

-- Бэкфилл: считаем, что сущности находятся в текущем статусе с момента последнего обновления
UPDATE "tasks" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;
UPDATE "projects" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;
UPDATE "deals" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;
UPDATE "reminders" SET "status_changed_at" = "updatedAt" WHERE "status_changed_at" IS NULL;
