-- CreateTable
CREATE TABLE "handler_settings" (
    "id" TEXT NOT NULL,
    "greeting" TEXT NOT NULL DEFAULT '',
    "completion" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handler_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "handler_settings" ADD CONSTRAINT "handler_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
