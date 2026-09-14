-- CreateTable
CREATE TABLE "email_filters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "from_contains" TEXT,
    "to_contains" TEXT,
    "subject_contains" TEXT,
    "body_contains" TEXT,
    "has_attachments" BOOLEAN,
    "create_task" BOOLEAN NOT NULL DEFAULT true,
    "project_id" TEXT,
    "assignee_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "priority" TEXT,
    "status" TEXT,
    "mark_read" BOOLEAN,
    "move_to_folder" TEXT,
    "stop_processing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_filter_logs" (
    "id" TEXT NOT NULL,
    "filter_id" TEXT,
    "email_from" TEXT,
    "email_to" TEXT,
    "subject" TEXT,
    "action" TEXT NOT NULL,
    "task_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_filter_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_filters_sort_order_idx" ON "email_filters"("sort_order");
CREATE INDEX "email_filter_logs_created_at_idx" ON "email_filter_logs"("created_at");

-- AddForeignKey
ALTER TABLE "email_filters" ADD CONSTRAINT "email_filters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_filter_logs" ADD CONSTRAINT "email_filter_logs_filter_id_fkey" FOREIGN KEY ("filter_id") REFERENCES "email_filters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
