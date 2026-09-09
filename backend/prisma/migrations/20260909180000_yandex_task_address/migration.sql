-- Add address to tasks (Yandex map)
ALTER TABLE "tasks" ADD COLUMN "address" TEXT;

-- Yandex integration settings (API key for Yandex Maps)
CREATE TABLE "yandex_settings" (
    "id" TEXT NOT NULL,
    "api_key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "yandex_settings_pkey" PRIMARY KEY ("id")
);
