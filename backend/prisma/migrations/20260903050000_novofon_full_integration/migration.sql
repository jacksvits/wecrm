-- Add novofon_extension to users
ALTER TABLE "users" ADD COLUMN "novofon_extension" TEXT;

-- Add new telephony settings columns
ALTER TABLE "telephony_settings" ADD COLUMN "auto_create_task_on_incoming" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "telephony_settings" ADD COLUMN "auto_create_task_on_outgoing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "telephony_settings" ADD COLUMN "auto_attach_record" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "telephony_settings" ADD COLUMN "notify_admins_on_sms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "telephony_settings" ADD COLUMN "default_iov_employee_id" INTEGER;
ALTER TABLE "telephony_settings" ADD COLUMN "default_iov_employee_name" TEXT;

-- Create SMS messages table
CREATE TABLE "sms_messages" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "contact_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sms_messages_from_idx" ON "sms_messages"("from");
CREATE INDEX "sms_messages_received_at_idx" ON "sms_messages"("received_at");
CREATE INDEX "sms_messages_contact_id_idx" ON "sms_messages"("contact_id");

ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
