-- Plugin "Yandex Metrika": connection settings (counters + OAuth token)

CREATE TABLE "yandex_metrika_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "counter_id" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yandex_metrika_settings_pkey" PRIMARY KEY ("id")
);
