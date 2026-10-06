-- Персональная опция «Доступ к складскому учёту» (склады, цены, номенклатура) на уровне менеджера.
-- Итоговый доступ пользователя = флаг пользователя ИЛИ флаг его роли (roles.stock_access).

-- AlterTable
ALTER TABLE "users" ADD COLUMN "stock_access" BOOLEAN NOT NULL DEFAULT false;
