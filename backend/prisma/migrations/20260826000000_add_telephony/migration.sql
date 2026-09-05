-- CreateTable
CREATE TABLE "telephony_settings" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "api_key" TEXT NOT NULL,
    "api_secret" TEXT NOT NULL,
    "virtual_number" TEXT,
    "webhook_secret" TEXT,
    "auto_create_contact" BOOLEAN NOT NULL DEFAULT true,
    "auto_create_task" BOOLEAN NOT NULL DEFAULT false,
    "default_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telephony_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "pbx_call_id" TEXT NOT NULL,
    "call_id_with_rec" TEXT,
    "direction" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "called_did" TEXT NOT NULL,
    "internal" TEXT,
    "employee_name" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "disposition" TEXT NOT NULL DEFAULT 'unknown',
    "status_code" TEXT,
    "is_recorded" BOOLEAN NOT NULL DEFAULT false,
    "record_url" TEXT,
    "record_local_path" TEXT,
    "record_downloaded_at" TIMESTAMP(3),
    "call_start" TIMESTAMP(3) NOT NULL,
    "call_end" TIMESTAMP(3),
    "contact_id" TEXT,
    "task_id" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calls_pbx_call_id_key" ON "calls"("pbx_call_id");

-- CreateIndex
CREATE INDEX "calls_caller_id_idx" ON "calls"("caller_id");

-- CreateIndex
CREATE INDEX "calls_call_start_idx" ON "calls"("call_start");

-- CreateIndex
CREATE INDEX "calls_contact_id_idx" ON "calls"("contact_id");

-- CreateIndex
CREATE INDEX "calls_direction_disposition_idx" ON "calls"("direction", "disposition");

-- AddForeignKey
ALTER TABLE "telephony_settings" ADD CONSTRAINT "telephony_settings_default_user_id_fkey" FOREIGN KEY ("default_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
