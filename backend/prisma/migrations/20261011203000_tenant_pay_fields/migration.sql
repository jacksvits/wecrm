-- Оплата подписок: ссылка на оплату у товара + реквизиты у tenant'а

ALTER TABLE "products" ADD COLUMN "pay_link" TEXT;

ALTER TABLE "tenants" ADD COLUMN "payment_info" TEXT;
