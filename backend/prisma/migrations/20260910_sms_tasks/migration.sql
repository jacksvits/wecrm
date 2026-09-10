-- SMS: связь с задачами + флаг автосоздания задачи из входящей SMS
ALTER TABLE "sms_messages" ADD COLUMN "task_id" TEXT;
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sms_messages_task_id_idx" ON "sms_messages"("task_id");
ALTER TABLE "telephony_settings" ADD COLUMN "auto_create_task_on_sms" BOOLEAN NOT NULL DEFAULT false;
