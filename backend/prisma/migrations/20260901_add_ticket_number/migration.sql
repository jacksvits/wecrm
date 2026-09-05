-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "ticket_number" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tasks_ticket_number_key" ON "tasks"("ticket_number");
