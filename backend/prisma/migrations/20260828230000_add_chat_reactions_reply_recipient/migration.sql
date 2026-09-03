-- Add chat reactions, replyTo, recipient, deletedAt to ChatMessage

-- Add columns to chat_messages
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "reply_to_id" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "recipient_id" TEXT;

-- Create chat_reactions table
CREATE TABLE IF NOT EXISTS "chat_reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👍',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("id")
);

-- Create unique index for reaction deduplication
CREATE UNIQUE INDEX IF NOT EXISTS "chat_reactions_message_id_user_id_emoji_key" ON "chat_reactions"("message_id", "user_id", "emoji");

-- Create indexes
CREATE INDEX IF NOT EXISTS "chat_reactions_message_id_idx" ON "chat_reactions"("message_id");
CREATE INDEX IF NOT EXISTS "chat_reactions_user_id_idx" ON "chat_reactions"("user_id");
CREATE INDEX IF NOT EXISTS "chat_messages_reply_to_id_idx" ON "chat_messages"("reply_to_id");
CREATE INDEX IF NOT EXISTS "chat_messages_recipient_id_idx" ON "chat_messages"("recipient_id");
CREATE INDEX IF NOT EXISTS "chat_messages_deleted_at_idx" ON "chat_messages"("deleted_at");

-- Add foreign keys
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
