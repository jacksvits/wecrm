CREATE TABLE IF NOT EXISTS "auth_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "tenant_slug" TEXT NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "user_id" TEXT,
    "login" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "client_type" TEXT NOT NULL,
    "auth_method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "auth_events_created_at_idx" ON "auth_events"("created_at");
CREATE INDEX IF NOT EXISTS "auth_events_tenant_slug_created_at_idx" ON "auth_events"("tenant_slug", "created_at");
