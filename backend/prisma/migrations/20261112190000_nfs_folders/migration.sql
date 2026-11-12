-- Extend file_tab_settings into NFS folder registry and seed default shares

ALTER TABLE "file_tab_settings"
  ADD COLUMN "label" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "host" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "nfs_export" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "read_only" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sort" INTEGER NOT NULL DEFAULT 0;

-- Существующие строки 4 вкладок: подставляем NFS-источники (монтирование теперь в контейнере)
UPDATE "file_tab_settings" SET "label" = 'Программы', "host" = '192.168.8.3', "nfs_export" = '/volume3/SOFT', "sort" = 1 WHERE "tab_key" = 'programs';
UPDATE "file_tab_settings" SET "label" = 'Драйвера', "host" = '192.168.8.3', "nfs_export" = '/volume3/DRIVER', "sort" = 2 WHERE "tab_key" = 'drivers';
UPDATE "file_tab_settings" SET "label" = 'Документы', "host" = '192.168.8.3', "nfs_export" = '/volume2/BOOK', "sort" = 3 WHERE "tab_key" = 'documents';
UPDATE "file_tab_settings" SET "label" = 'Игры', "host" = '192.168.8.3', "nfs_export" = '/volume3/GAME', "sort" = 4 WHERE "tab_key" = 'games';

-- Если строк ещё нет (настройки вкладок не сохранялись) — создаём
INSERT INTO "file_tab_settings" ("id", "tab_key", "label", "host", "nfs_export", "read_only", "sort", "path", "url", "created_at", "updated_at")
SELECT gen_random_uuid()::text, v.*
FROM (VALUES
  ('programs', 'Программы', '192.168.8.3', '/volume3/SOFT', false, 1, '/mnt/nfs/SOFT', ''),
  ('drivers', 'Драйвера', '192.168.8.3', '/volume3/DRIVER', false, 2, '/mnt/nfs/DRIVER', ''),
  ('documents', 'Документы', '192.168.8.3', '/volume2/BOOK', false, 3, '/mnt/nfs/BOOK', ''),
  ('games', 'Игры', '192.168.8.3', '/volume3/GAME', false, 4, '/mnt/nfs/GAME', '')
) AS v("tab_key", "label", "host", "nfs_export", "read_only", "sort", "path", "url")
WHERE NOT EXISTS (SELECT 1 FROM "file_tab_settings" f WHERE f."tab_key" = v."tab_key");
