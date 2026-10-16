-- Роли: опция «Системный обработчик» — пользователи роли не учитываются
-- в виджете push-уведомлений на странице Директора

ALTER TABLE "roles" ADD COLUMN "is_system_handler" BOOLEAN NOT NULL DEFAULT false;
