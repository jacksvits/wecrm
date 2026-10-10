-- Изображение товара по умолчанию: показывается у товаров без фото
ALTER TABLE "branding" ADD COLUMN IF NOT EXISTS "product_default_image_path" TEXT;
