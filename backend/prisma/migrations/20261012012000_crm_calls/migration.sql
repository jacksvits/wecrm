-- Подписка CRM: опция Звонки

ALTER TABLE "products" ADD COLUMN "crm_calls" BOOLEAN NOT NULL DEFAULT false;
