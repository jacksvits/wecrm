CREATE TABLE "onec_plugin_settings" (
  "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "service_url" TEXT NOT NULL DEFAULT '',
  "login" TEXT NOT NULL DEFAULT '',
  "password" TEXT NOT NULL DEFAULT '',
  "sync_interval_minutes" INTEGER NOT NULL DEFAULT 15,
  "last_sync_at" TIMESTAMP(3),
  "last_sync_result" JSONB,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "products" ADD COLUMN "onec_id" TEXT;
ALTER TABLE "products" ADD COLUMN "onec_synced_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "products_onec_id_key" ON "products"("onec_id");

ALTER TABLE "contacts" ADD COLUMN "onec_id" TEXT;
CREATE INDEX "contacts_onec_id_idx" ON "contacts"("onec_id");
