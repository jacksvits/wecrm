-- Стиль кнопки промо-блока: green — как «В резерв», blue — как «В корзину» (значение по умолчанию)

-- AlterTable
ALTER TABLE "promo_blocks" ADD COLUMN "button_style" TEXT NOT NULL DEFAULT 'blue';
