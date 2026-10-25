-- Плагин «CDEK (СДЭК)»: доставка заказов из CRM (полный цикл).
-- Настройки подключения (тестовый/боевой контур, OAuth-кэш, вебхук, отправитель по умолчанию)
-- и таблица отправлений СДЭК со статусами и связью со сделками/контактами.
CREATE TABLE "cdek_settings" (
  "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "environment" TEXT NOT NULL DEFAULT 'test',
  "account" TEXT NOT NULL DEFAULT '',
  "secure_password" TEXT NOT NULL DEFAULT '',
  "access_token" TEXT NOT NULL DEFAULT '',
  "token_expires_at" TIMESTAMPTZ,
  "webhook_token" TEXT NOT NULL DEFAULT '',
  "sender_city_code" INTEGER,
  "sender_company" TEXT NOT NULL DEFAULT '',
  "sender_name" TEXT NOT NULL DEFAULT '',
  "sender_phone" TEXT NOT NULL DEFAULT '',
  "sender_address" TEXT NOT NULL DEFAULT '',
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "cdek_shipments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "uuid" TEXT,
  "cdek_number" TEXT,
  "deal_id" TEXT,
  "contact_id" TEXT,
  "im_number" TEXT NOT NULL,
  "tariff_code" INTEGER NOT NULL,
  "delivery_mode" TEXT NOT NULL DEFAULT 'door',
  "delivery_sum" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'RUB',
  "from_city" TEXT NOT NULL DEFAULT '',
  "to_city" TEXT NOT NULL,
  "to_address" TEXT NOT NULL DEFAULT '',
  "delivery_point_code" TEXT,
  "recipient_name" TEXT NOT NULL,
  "recipient_phone" TEXT NOT NULL,
  "recipient_email" TEXT NOT NULL DEFAULT '',
  "weight_grams" INTEGER NOT NULL,
  "length_cm" INTEGER,
  "width_cm" INTEGER,
  "height_cm" INTEGER,
  "cod_amount" INTEGER NOT NULL DEFAULT 0,
  "declared_value" INTEGER NOT NULL DEFAULT 0,
  "item_name" TEXT NOT NULL DEFAULT '',
  "comment" TEXT NOT NULL DEFAULT '',
  "status_code" TEXT,
  "status_name" TEXT,
  "status_at" TIMESTAMPTZ,
  "status_history" TEXT,
  "request_state" TEXT,
  "last_error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "cdek_shipments_deal_id_idx" ON "cdek_shipments"("deal_id");
CREATE INDEX "cdek_shipments_contact_id_idx" ON "cdek_shipments"("contact_id");
