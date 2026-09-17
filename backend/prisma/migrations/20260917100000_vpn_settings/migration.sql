-- Таблица настроек плагина «Прокси через VPN»
CREATE TABLE "vpn_settings" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "subscription_url" TEXT NOT NULL,
    "last_config_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vpn_settings_pkey" PRIMARY KEY ("id")
);
