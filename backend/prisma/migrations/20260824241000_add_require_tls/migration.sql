-- Add requireTLS option to email_settings for STARTTLS support
ALTER TABLE "email_settings" ADD COLUMN "requireTLS" BOOLEAN NOT NULL DEFAULT true;
