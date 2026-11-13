-- Рекламные блоки: признак "липкого" блока (закреплён при прокрутке)

ALTER TABLE "ad_blocks" ADD COLUMN "is_sticky" BOOLEAN NOT NULL DEFAULT false;
