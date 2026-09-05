-- Add TLS/SSL configuration options to email_settings
ALTER TABLE "email_settings" ADD COLUMN "secure" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "email_settings" ADD COLUMN "rejectUnauthorized" BOOLEAN NOT NULL DEFAULT false;
