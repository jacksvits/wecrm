CREATE TABLE IF NOT EXISTS "ip_access_rules" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "list_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_access_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ip_access_rules_ip_address_list_type_key" ON "ip_access_rules"("ip_address", "list_type");
CREATE INDEX IF NOT EXISTS "ip_access_rules_list_type_idx" ON "ip_access_rules"("list_type");
