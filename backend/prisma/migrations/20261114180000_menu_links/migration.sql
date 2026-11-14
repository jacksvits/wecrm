-- Ссылки кнопок меню в футере страницы входа (Настройки → Системные → Меню)

CREATE TABLE "menu_links" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "menu_links_key_key" ON "menu_links"("key");
