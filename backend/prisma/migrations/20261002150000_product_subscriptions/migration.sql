-- «Подписка» для услуг: флаг на товаре + таблица подписочных заявок

-- AlterTable
ALTER TABLE "products" ADD COLUMN "is_subscription" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "product_subscriptions" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "user_id" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'month',
    "status" TEXT NOT NULL DEFAULT 'new',
    "comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_subscriptions_number_key" ON "product_subscriptions"("number");

-- CreateIndex
CREATE INDEX "product_subscriptions_product_id_idx" ON "product_subscriptions"("product_id");

-- CreateIndex
CREATE INDEX "product_subscriptions_contact_id_idx" ON "product_subscriptions"("contact_id");

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
