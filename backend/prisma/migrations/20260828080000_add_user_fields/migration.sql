-- Add missing user fields

-- Add username column (nullable, unique)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- Add emails array column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emails" TEXT[] DEFAULT '{}';

-- Add last_active_at timestamp
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3);

-- Add allowed_pages array column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "allowed_pages" TEXT[] DEFAULT '{}';
