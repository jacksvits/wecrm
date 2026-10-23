-- Опция «Ozon» вида цен: активный вид цены с флагом for_ozon используется
-- плагином OZON Seller при синхронизации цен (вместо розничного вида).
-- Флаг эксклюзивный — отмеченным может быть только один вид цен.
ALTER TABLE "price_types" ADD COLUMN "for_ozon" BOOLEAN NOT NULL DEFAULT false;
