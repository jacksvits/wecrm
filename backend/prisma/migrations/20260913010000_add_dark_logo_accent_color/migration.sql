-- Логотип для тёмной темы и кастомный цвет акцента проекта
ALTER TABLE "branding" ADD COLUMN "dark_logo_path" TEXT;
ALTER TABLE "branding" ADD COLUMN "accent_color" TEXT;
