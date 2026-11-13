-- Рекламные блоки на публичной странице новостей (колонки слева/справа от ленты)

CREATE TABLE "ad_blocks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT,
    "link_url" TEXT,
    "position" TEXT NOT NULL DEFAULT 'left',
    "size" TEXT NOT NULL DEFAULT 'small',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_blocks_pkey" PRIMARY KEY ("id")
);
