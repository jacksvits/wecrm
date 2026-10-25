-- Настройки плагина «ВК сообщество»: проект по умолчанию для создаваемых задач
ALTER TABLE "vk_community_settings" ADD COLUMN "default_project_id" TEXT;

ALTER TABLE "vk_community_settings" ADD CONSTRAINT "vk_community_settings_default_project_id_fkey"
    FOREIGN KEY ("default_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
