-- Видимость NFS-папки по ролям: пустой массив = видят все
ALTER TABLE "file_tab_settings" ADD COLUMN "allowed_roles" TEXT[] NOT NULL DEFAULT '{}';
