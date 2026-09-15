-- CreateTable для аудио/видеозвонков между пользователями (WebRTC).
-- Таблица web_calls: calls занята телефонией (Novofon).

CREATE TABLE "web_calls" (
    "id" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "callee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'audio',
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_calls_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "web_calls_caller_id_created_at_idx" ON "web_calls"("caller_id", "created_at");
CREATE INDEX "web_calls_callee_id_created_at_idx" ON "web_calls"("callee_id", "created_at");
CREATE INDEX "web_calls_status_idx" ON "web_calls"("status");

ALTER TABLE "web_calls" ADD CONSTRAINT "web_calls_caller_id_fkey"
    FOREIGN KEY ("caller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "web_calls" ADD CONSTRAINT "web_calls_callee_id_fkey"
    FOREIGN KEY ("callee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
