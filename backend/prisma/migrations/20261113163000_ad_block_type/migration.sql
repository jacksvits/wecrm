-- Рекламные блоки: тип блока (banner | script) и поле для вставки скрипта

ALTER TABLE "ad_blocks" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'banner';
ALTER TABLE "ad_blocks" ADD COLUMN "script" TEXT;
