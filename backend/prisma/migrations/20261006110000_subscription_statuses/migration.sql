-- Статусы подписок: единая модель active | expired | cancelled.
-- Старые значения new/paused приводим к active («Закончилась» вычисляется
-- автоматически по дате окончания, отдельное значение в БД не требуется).

UPDATE "product_subscriptions" SET "status" = 'active' WHERE "status" IN ('new', 'paused');
