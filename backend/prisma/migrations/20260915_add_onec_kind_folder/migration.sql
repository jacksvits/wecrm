-- Плагин 1С: папка справочника «Виды номенклатуры», ветка которой синхронизируется с CRM (пусто = все виды)
ALTER TABLE "onec_plugin_settings" ADD COLUMN IF NOT EXISTS "kind_folder" TEXT NOT NULL DEFAULT '';
