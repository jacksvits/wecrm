-- Таблица счётчиков скачиваний файлов/папок страницы «Файлы»
CREATE TABLE IF NOT EXISTS "file_download_counts" (
    "id" TEXT NOT NULL,
    "tab_key" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_download_counts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "file_download_counts_tab_key_file_path_key" ON "file_download_counts"("tab_key", "file_path");

-- Вид отображения (icons/table) в настройках страницы «Файлы»
ALTER TABLE "file_hide_settings" ADD COLUMN IF NOT EXISTS "view_mode" TEXT NOT NULL DEFAULT 'icons';
