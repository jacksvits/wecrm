-- Create chat_messages table for global team chat
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- Create index on authorId for fast lookups
CREATE INDEX "chat_messages_authorId_idx" ON "chat_messages"("authorId");

-- Add foreign key constraint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
