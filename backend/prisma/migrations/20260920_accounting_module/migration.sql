-- Модуль «Бухгалтерия по почте»: настройки ящика, правила классификации,
-- финансовые документы и кэш банковских операций Точки.
-- SQL идемпотентный: таблицы/индексы создаются через IF NOT EXISTS,
-- внешние ключи добавляются через DO-блоки с проверкой существования constraint.

-- CreateTable
CREATE TABLE IF NOT EXISTS "accounting_email_settings" (
    "id" TEXT NOT NULL,
    "imap_host" TEXT NOT NULL,
    "imap_port" INTEGER NOT NULL DEFAULT 993,
    "imap_user" TEXT NOT NULL,
    "imap_pass" TEXT NOT NULL,
    "check_interval_ms" INTEGER NOT NULL DEFAULT 60000,
    "processed_folder" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "reject_unauthorized" BOOLEAN NOT NULL DEFAULT false,
    "require_tls" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_email_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "accounting_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "from_contains" TEXT,
    "subject_contains" TEXT,
    "body_contains" TEXT,
    "has_attachments" BOOLEAN,
    "doc_type" TEXT NOT NULL DEFAULT 'other',
    "direction" TEXT NOT NULL DEFAULT 'incoming',
    "contact_id" TEXT,
    "stop_processing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "finance_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "direction" TEXT NOT NULL DEFAULT 'incoming',
    "number" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "counterparty_name" TEXT,
    "counterparty_inn" TEXT,
    "contact_id" TEXT,
    "task_id" TEXT,
    "deal_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'email',
    "email_message_id" TEXT,
    "email_from" TEXT,
    "email_subject" TEXT,
    "notes" TEXT,
    "match_status" TEXT NOT NULL DEFAULT 'unmatched',
    "matched_payment_id" TEXT,
    "fiscal_fn" TEXT,
    "fiscal_fd" TEXT,
    "fiscal_fp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "bank_payments" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'debit',
    "counterparty_name" TEXT,
    "counterparty_inn" TEXT,
    "purpose" TEXT,
    "raw" JSONB,
    "matched_document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "accounting_rules_sort_order_idx" ON "accounting_rules"("sort_order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_documents_date_idx" ON "finance_documents"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_documents_type_idx" ON "finance_documents"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_documents_contact_id_idx" ON "finance_documents"("contact_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_documents_task_id_idx" ON "finance_documents"("task_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "finance_documents_match_status_idx" ON "finance_documents"("match_status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "finance_documents_email_message_id_key" ON "finance_documents"("email_message_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bank_payments_account_id_payment_id_key" ON "bank_payments"("account_id", "payment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bank_payments_date_idx" ON "bank_payments"("date");

-- AddForeignKey (идемпотентно: пропускаем, если constraint уже существует)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounting_rules_contact_id_fkey') THEN
        ALTER TABLE "accounting_rules" ADD CONSTRAINT "accounting_rules_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_documents_contact_id_fkey') THEN
        ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_documents_task_id_fkey') THEN
        ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'finance_documents_deal_id_fkey') THEN
        ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
