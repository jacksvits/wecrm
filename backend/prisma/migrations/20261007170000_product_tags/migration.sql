-- Теги карточек товаров: свободный ввод с автоподстановкой, фильтр на витрине
ALTER TABLE "products" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';
