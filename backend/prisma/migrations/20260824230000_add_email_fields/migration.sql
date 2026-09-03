-- Add email integration columns to tasks table for IMAP worker
ALTER TABLE "tasks" ADD COLUMN "emailMessageId" TEXT;
ALTER TABLE "tasks" ADD COLUMN "sourceEmail" TEXT;

-- Ensure unique constraint on email message ID to prevent duplicate tasks from same email
CREATE UNIQUE INDEX "tasks_emailMessageId_key" ON "tasks"("emailMessageId");
