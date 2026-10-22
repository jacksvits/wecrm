-- Системный часовой пояс организации:
-- 1) branding.timezone — дефолтный пояс для всех пользователей тенанта;
-- 2) users.timezone становится необязательным — null означает
--    «как у организации» (личный выбор в профиле переопределяет системный);
-- 3) ранее автоматически проставленное значение 'UTC' сбрасывается,
--    чтобы вступил системный пояс (UTC можно выбрать явно в профиле).
ALTER TABLE "branding" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "users" ALTER COLUMN "timezone" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "timezone" DROP DEFAULT;
UPDATE "users" SET "timezone" = NULL WHERE "timezone" = 'UTC';
