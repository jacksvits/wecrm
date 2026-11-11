-- Публичные ссылки «Поделиться» на файл/папку страницы «Файлы»
CREATE TABLE "file_share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "disk_path" TEXT NOT NULL,
    "tab_key" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "is_folder" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_share_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "file_share_links_token_key" ON "file_share_links"("token");
