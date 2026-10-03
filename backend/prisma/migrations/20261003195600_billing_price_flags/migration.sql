-- Способы оплаты в резервах и продажах + признаки видов цен «Розничная» и «Использовать для безнала»

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "payment_method" TEXT;

-- AlterTable
ALTER TABLE "price_types" ADD COLUMN "is_retail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "price_types" ADD COLUMN "for_cashless" BOOLEAN NOT NULL DEFAULT false;
