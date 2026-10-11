-- Подписка CRM: опции Система подписок, Ведение бухгалтерии, Кружочки в чате

ALTER TABLE "products" ADD COLUMN "crm_subscriptions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "crm_accounting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "crm_video_notes" BOOLEAN NOT NULL DEFAULT false;
