-- AlterTable
ALTER TABLE "branding" ADD COLUMN "splash_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "branding" ADD COLUMN "splash_path" TEXT;
