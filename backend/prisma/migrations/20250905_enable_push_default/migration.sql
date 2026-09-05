-- Migration: Enable push notifications by default for all existing users
-- Created: 2026-09-05

UPDATE "users" SET "push_enabled" = true WHERE "push_enabled" IS NULL OR "push_enabled" = false;
