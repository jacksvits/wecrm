-- Удаление неиспользуемого поля «Компания» у контакта (организация задаётся привязкой)
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "company";
