-- Стиль карточек товаров на витрине: gloss | flat | neomorph
ALTER TABLE "branding" ADD COLUMN IF NOT EXISTS "product_card_style" TEXT;
