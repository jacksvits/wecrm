CREATE TABLE IF NOT EXISTS "ip_security_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "failure_threshold" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_security_settings_pkey" PRIMARY KEY ("id")
);
