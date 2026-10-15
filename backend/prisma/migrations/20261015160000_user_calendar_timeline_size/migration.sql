-- Пользователи: размер панели временной шкалы в виджете «Календарь» на дашборде, px
-- (ширина панели при положении right/left, высота при bottom)

ALTER TABLE "users" ADD COLUMN "calendar_timeline_size" INTEGER NOT NULL DEFAULT 420;
