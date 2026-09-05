-- CreateTable
CREATE TABLE "pskovline_settings" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Псковлайн',
    "login" TEXT NOT NULL DEFAULT '91868',
    "password" TEXT NOT NULL DEFAULT 'e5yvku2a',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pskovline_settings_pkey" PRIMARY KEY ("id")
);
