-- CreateTable
CREATE TABLE IF NOT EXISTS "contact_projects" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "contact_projects_contact_id_project_id_key" ON "contact_projects"("contact_id", "project_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contact_projects_contact_id_idx" ON "contact_projects"("contact_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contact_projects_project_id_idx" ON "contact_projects"("project_id");

-- AddForeignKey
ALTER TABLE "contact_projects" DROP CONSTRAINT IF EXISTS "contact_projects_contact_id_fkey";
ALTER TABLE "contact_projects" ADD CONSTRAINT "contact_projects_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_projects" DROP CONSTRAINT IF EXISTS "contact_projects_project_id_fkey";
ALTER TABLE "contact_projects" ADD CONSTRAINT "contact_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
