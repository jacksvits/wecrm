-- CreateTable
CREATE TABLE "seo_settings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "canonical" TEXT NOT NULL DEFAULT '',
    "robots" TEXT NOT NULL DEFAULT '',
    "lang" TEXT NOT NULL DEFAULT '',
    "viewport" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);
