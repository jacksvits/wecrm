-- Время ежедневного обновления данных Beget (чч:мм), по умолчанию 10:00
ALTER TABLE "beget_settings" ADD COLUMN "update_time" TEXT NOT NULL DEFAULT '10:00';
