-- Плагин «Эквайринг от Точки»: настройки терминала и онлайн-платежи витрины (карта/СБП)

CREATE TABLE "tochka_acquiring_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "terminal_key" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "tochka_acquiring_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sale_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "payment_url" TEXT,
    "qr_data" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "tochka_acquiring_payments_order_id_key" ON "tochka_acquiring_payments"("order_id");
ALTER TABLE "tochka_acquiring_payments" ADD CONSTRAINT "tochka_acquiring_payments_sale_id_fkey"
  FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
