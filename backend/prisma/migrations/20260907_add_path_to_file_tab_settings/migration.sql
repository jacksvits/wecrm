-- AlterTable
ALTER TABLE "file_tab_settings" ADD COLUMN IF NOT EXISTS "path" TEXT NOT NULL DEFAULT '';
