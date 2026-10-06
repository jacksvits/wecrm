-- Вкладка «Подписки» в каталоге: явная дата окончания оплаченного периода
-- (задаётся при активации/продлении, редактируется вручную)

-- AlterTable
ALTER TABLE "product_subscriptions" ADD COLUMN "ends_at" TIMESTAMP(3);
