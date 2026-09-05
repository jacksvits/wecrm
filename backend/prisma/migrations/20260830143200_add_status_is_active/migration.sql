-- Добавление поля is_active в таблицу statuses
ALTER TABLE statuses ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
