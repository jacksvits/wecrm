-- Подписка CRM: опция Подключение камер (вкладка Камеры у директора)

ALTER TABLE "products" ADD COLUMN "crm_cameras" BOOLEAN NOT NULL DEFAULT false;
