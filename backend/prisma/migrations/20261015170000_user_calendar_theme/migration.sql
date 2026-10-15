-- Пользователи: цветовая тема виджета «Календарь» на дашборде: classic | ocean | amethyst

ALTER TABLE "users" ADD COLUMN "calendar_theme" TEXT NOT NULL DEFAULT 'classic';
