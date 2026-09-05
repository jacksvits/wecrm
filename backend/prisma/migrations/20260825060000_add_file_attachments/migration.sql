-- Create file_attachments table for file uploads across chat, tasks and comments
CREATE TABLE "file_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- Index for fast lookups by entity
CREATE INDEX "file_attachments_entityType_entityId_idx" ON "file_attachments"("entityType", "entityId");

-- Foreign key to users
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
