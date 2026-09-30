-- CreateTable
CREATE TABLE IF NOT EXISTS "contact_accesses" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "url" TEXT,
    "login" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contact_accesses_contact_id_idx" ON "contact_accesses"("contact_id");

-- AddForeignKey
ALTER TABLE "contact_accesses" DROP CONSTRAINT IF EXISTS "contact_accesses_contact_id_fkey";
ALTER TABLE "contact_accesses" ADD CONSTRAINT "contact_accesses_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
