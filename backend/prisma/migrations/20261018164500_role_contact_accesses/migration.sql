-- Права на вкладку «Доступы» у контактов и организаций: чтение / редактирование / удаление
ALTER TABLE "roles" ADD COLUMN "can_read_contact_accesses" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "roles" ADD COLUMN "can_edit_contact_accesses" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "roles" ADD COLUMN "can_delete_contact_accesses" BOOLEAN NOT NULL DEFAULT false;

-- Существующим привилегированным ролям сохраняем прежние возможности (как было у manager/admin)
UPDATE "roles" SET "can_edit_contact_accesses" = true, "can_delete_contact_accesses" = true WHERE "name" IN ('admin', 'manager');
