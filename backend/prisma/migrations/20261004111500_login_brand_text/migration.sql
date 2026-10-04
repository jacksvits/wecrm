-- Текст левой панели страницы авторизации (редактируется в «Слайдер авторизации», null — дефолт)

-- AlterTable
ALTER TABLE "branding" ADD COLUMN "login_title" TEXT;
ALTER TABLE "branding" ADD COLUMN "login_accent" TEXT;
ALTER TABLE "branding" ADD COLUMN "login_subtitle" TEXT;
