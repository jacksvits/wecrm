-- Запросы организаций в поддержку платформы (tenant_tickets)

CREATE TABLE "tenant_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tenant_slug" TEXT NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "author_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_role" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenant_tickets_tenant_id_idx" ON "tenant_tickets"("tenant_id");
CREATE INDEX "tenant_tickets_status_idx" ON "tenant_tickets"("status");
CREATE INDEX "tenant_ticket_messages_ticket_id_idx" ON "tenant_ticket_messages"("ticket_id");
