-- Добавляем результат попытки входа; существующие записи остаются успешными.
ALTER TABLE "auth_events" ADD COLUMN IF NOT EXISTS "success" BOOLEAN NOT NULL DEFAULT true;
