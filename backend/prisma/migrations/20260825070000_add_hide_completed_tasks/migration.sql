-- Add hideCompletedTasks preference to users
ALTER TABLE "users" ADD COLUMN "hideCompletedTasks" BOOLEAN NOT NULL DEFAULT false;
