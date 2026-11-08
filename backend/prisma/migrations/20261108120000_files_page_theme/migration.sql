-- AlterTable
ALTER TABLE "file_hide_settings" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'standard';
