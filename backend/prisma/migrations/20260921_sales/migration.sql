-- Продажи (реализация) с корзины витрины; оплата (интернет-эквайринг) — позже
CREATE TABLE IF NOT EXISTS "sales" (
  "id" TEXT PRIMARY KEY,
  "number" INTEGER NOT NULL UNIQUE,
  "contactId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "userId" TEXT,
  "comment" TEXT,
  "total" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'new',
  "paymentMethod" TEXT,
  "paymentId" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "sale_items" (
  "id" TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" NUMERIC(12,3) NOT NULL,
  "price" NUMERIC(12,2) NOT NULL,
  "sum" NUMERIC(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS "sales_contactId_idx" ON "sales"("contactId");
CREATE INDEX IF NOT EXISTS "sales_warehouseId_idx" ON "sales"("warehouseId");
CREATE INDEX IF NOT EXISTS "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX IF NOT EXISTS "sale_items_productId_idx" ON "sale_items"("productId");
