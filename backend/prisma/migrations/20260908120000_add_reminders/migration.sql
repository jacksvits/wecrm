-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL,
    "status_id" TEXT,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "notify_before_min" INTEGER NOT NULL DEFAULT 0,
    "repeat" TEXT NOT NULL DEFAULT 'none',
    "repeat_end_at" TIMESTAMP(3),
    "last_notified_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_user_id_idx" ON "reminders"("user_id");
CREATE INDEX "reminders_remind_at_idx" ON "reminders"("remind_at");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default statuses for reminders
INSERT INTO statuses (id, entity_type, name, label, color, text_color, sort_order, is_default) VALUES
(gen_random_uuid()::TEXT, 'reminder', 'active', 'Активно', '#fef3c7', '#92400e', 0, true),
(gen_random_uuid()::TEXT, 'reminder', 'done', 'Выполнено', '#dcfce7', '#166534', 1, false)
ON CONFLICT DO NOTHING;
