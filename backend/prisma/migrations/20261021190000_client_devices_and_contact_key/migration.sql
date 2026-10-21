-- Агент «Устройства клиентов» (Windows 10):
-- 1) у контактов появляется публичный ключ clientKey (000-000-000) для
--    привязки устройств агентом; ключ генерируется случайно и уникален;
-- 2) новая таблица client_devices — устройства (ПК) клиентов: система,
--    железо, диски, устройства из «Диспетчера устройств», онлайн-статус
--    по lastSeenAt, заметка менеджера.

CREATE TABLE "client_devices" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "device_key" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "workgroup" TEXT NOT NULL DEFAULT '',
    "os_caption" TEXT NOT NULL DEFAULT '',
    "os_version" TEXT NOT NULL DEFAULT '',
    "os_build" TEXT NOT NULL DEFAULT '',
    "os_arch" TEXT NOT NULL DEFAULT '',
    "os_install_date" TIMESTAMP(3),
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "serial_number" TEXT NOT NULL DEFAULT '',
    "cpu" TEXT NOT NULL DEFAULT '',
    "cpu_cores" INTEGER NOT NULL DEFAULT 0,
    "cpu_threads" INTEGER NOT NULL DEFAULT 0,
    "ram_total_mb" INTEGER NOT NULL DEFAULT 0,
    "disks" JSONB NOT NULL DEFAULT '[]',
    "pnp_devices" JSONB NOT NULL DEFAULT '[]',
    "ip_address" TEXT NOT NULL DEFAULT '',
    "mac_address" TEXT NOT NULL DEFAULT '',
    "gpu" TEXT NOT NULL DEFAULT '',
    "last_boot_at" TIMESTAMP(3),
    "agent_version" TEXT NOT NULL DEFAULT '',
    "comment" TEXT NOT NULL DEFAULT '',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_devices_pkey" PRIMARY KEY ("id")
);

-- Ключ привязки устройств у контактов
ALTER TABLE "contacts" ADD COLUMN "client_key" TEXT;

CREATE UNIQUE INDEX "contacts_client_key_key" ON "contacts"("client_key");
CREATE UNIQUE INDEX "client_devices_device_key_key" ON "client_devices"("device_key");
CREATE UNIQUE INDEX "client_devices_token_key" ON "client_devices"("token");
CREATE INDEX "client_devices_contact_id_idx" ON "client_devices"("contact_id");

-- Бэкфилл: случайные ключи формата 000-000-000 для существующих контактов
DO $$
DECLARE
    r RECORD;
    k TEXT;
BEGIN
    FOR r IN SELECT "id" FROM "contacts" WHERE "client_key" IS NULL LOOP
        LOOP
            k := lpad((floor(random() * 1000))::int::text, 3, '0') || '-' ||
                 lpad((floor(random() * 1000))::int::text, 3, '0') || '-' ||
                 lpad((floor(random() * 1000))::int::text, 3, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM "contacts" WHERE "client_key" = k);
        END LOOP;
        UPDATE "contacts" SET "client_key" = k WHERE "id" = r."id";
    END LOOP;
END $$;
