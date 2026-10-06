-- Продление подписок через эквайринг Точки: платёж может относиться
-- к подписке, а не только к продаже

-- AlterTable
ALTER TABLE "tochka_acquiring_payments" ADD COLUMN "subscription_id" TEXT;

-- AlterTable (продажа необязательна: у платежа за продление подписки её нет)
ALTER TABLE "tochka_acquiring_payments" ALTER COLUMN "sale_id" DROP NOT NULL;
