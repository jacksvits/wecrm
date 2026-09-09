-- CreateTable
CREATE TABLE "reminder_recipients" (
    "id" TEXT NOT NULL,
    "reminder_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reminder_recipients_reminder_id_user_id_key" ON "reminder_recipients"("reminder_id", "user_id");

-- AddForeignKey
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
