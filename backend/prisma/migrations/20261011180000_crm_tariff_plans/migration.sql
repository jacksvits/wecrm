-- Тарифы CRM: флаг категории каталога + выбранный тариф в tenant'е

ALTER TABLE "product_categories" ADD COLUMN "is_crm_tariff" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "tenants" ADD COLUMN "plan_product_id" TEXT;
