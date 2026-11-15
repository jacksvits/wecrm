-- Добавляем складу контактные поля: адрес, график работы, телефон
ALTER TABLE "warehouses" ADD COLUMN "address" TEXT;
ALTER TABLE "warehouses" ADD COLUMN "work_schedule" TEXT;
ALTER TABLE "warehouses" ADD COLUMN "phone" TEXT;
