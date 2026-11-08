-- CreateTable
CREATE TABLE "file_hide_settings" (
    "id" TEXT NOT NULL,
    "names" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_hide_settings_pkey" PRIMARY KEY ("id")
);
