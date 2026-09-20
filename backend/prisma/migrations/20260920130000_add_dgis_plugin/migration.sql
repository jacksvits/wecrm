-- 2GIS integration settings (API key for 2GIS MapGL, provider switch)
CREATE TABLE "dgis_settings" (
    "id" TEXT NOT NULL,
    "api_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dgis_settings_pkey" PRIMARY KEY ("id")
);
