-- CreateTable
CREATE TABLE "tenant_ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "message_id" TEXT,
    "tenant_slug" TEXT NOT NULL,
    "author_id" TEXT,
    "author_role" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_ticket_attachments_ticket_id_idx" ON "tenant_ticket_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "tenant_ticket_attachments_message_id_idx" ON "tenant_ticket_attachments"("message_id");

-- AddForeignKey
ALTER TABLE "tenant_ticket_attachments" ADD CONSTRAINT "tenant_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tenant_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_ticket_attachments" ADD CONSTRAINT "tenant_ticket_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "tenant_ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
