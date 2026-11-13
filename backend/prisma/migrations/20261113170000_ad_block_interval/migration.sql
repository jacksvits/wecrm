-- Рекламные блоки: интервал смены картинок (секунды, свой у каждого блока)

ALTER TABLE "ad_blocks" ADD COLUMN "interval_sec" INTEGER NOT NULL DEFAULT 4;
