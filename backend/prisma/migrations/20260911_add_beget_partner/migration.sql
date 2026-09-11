-- Галочка «Партнёр» плагина Beget: управляет виджетом «Бегет-Партнёр» и сбором партнёрских данных
ALTER TABLE "beget_settings" ADD COLUMN "is_partner" BOOLEAN NOT NULL DEFAULT false;
