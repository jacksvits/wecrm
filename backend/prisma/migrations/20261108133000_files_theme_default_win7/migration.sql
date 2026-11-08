-- AlterTable: тема по умолчанию — Windows 7 (темы standard/ios удалены)
ALTER TABLE "file_hide_settings" ALTER COLUMN "theme" SET DEFAULT 'win7';
UPDATE "file_hide_settings" SET "theme" = 'win7' WHERE "theme" NOT IN ('win7', 'macos');
