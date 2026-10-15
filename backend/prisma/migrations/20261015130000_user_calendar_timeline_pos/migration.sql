-- Пользователи: положение временной шкалы в виджете «Календарь» на дашборде (bottom | right | left)

ALTER TABLE "users" ADD COLUMN "calendar_timeline_pos" TEXT NOT NULL DEFAULT 'bottom';
