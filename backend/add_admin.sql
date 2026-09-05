-- Добавление администратора напрямую в БД
-- Сначала убедимся, что роль admin существует

INSERT INTO roles (id, name, label, color, "textColor", "sortOrder")
VALUES ('cm0admin00000000000000001', 'admin', 'Администраторы', '#dcfce7', '#166534', 1)
ON CONFLICT (name) DO UPDATE SET
  label = EXCLUDED.label,
  color = EXCLUDED.color,
  "textColor" = EXCLUDED."textColor",
  "sortOrder" = EXCLUDED."sortOrder";

-- Теперь добавляем пользователя-администратора
INSERT INTO users (id, email, password, name, "roleId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@wecrm.local',
  '$2b$10$2TuRpcI3oFrujWZlU4xz2OEanjldfF2jmO9suGMq5auBYRll5a0Xy',
  'Администратор',
  (SELECT id FROM roles WHERE name = 'admin'),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  "roleId" = EXCLUDED."roleId",
  "updatedAt" = NOW();

-- Проверяем
SELECT u.id, u.email, u.name, r.label as role, u."createdAt"
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id
WHERE u.email = 'admin@wecrm.local';
