-- Плагин «Камеры Hik-Connect»: код верификации устройства.
-- Нужен, если устройство отдаёт зашифрованный видеопоток (Stream Encryption):
-- сервис получает по нему ключ и расшифровывает поток на лету.

ALTER TABLE "hikvision_plugin_settings"
    ADD COLUMN IF NOT EXISTS "validate_code" TEXT NOT NULL DEFAULT '';
