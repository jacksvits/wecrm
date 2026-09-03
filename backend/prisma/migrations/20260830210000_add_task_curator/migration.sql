-- AlterTable
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "curator_id" TEXT;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

