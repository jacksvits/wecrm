-- ClientDevice: колонка updated_at (миграция 20261021190000 создала таблицу без неё)
ALTER TABLE "client_devices" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
