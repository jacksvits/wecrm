-- Аккаунты почтового клиента: у каждого пользователя свои, аккаунтов может быть несколько

-- CreateTable
CREATE TABLE "mail_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "imap_host" TEXT NOT NULL,
    "imap_port" INTEGER NOT NULL DEFAULT 993,
    "imap_user" TEXT NOT NULL,
    "imap_pass" TEXT NOT NULL,
    "smtp_host" TEXT NOT NULL,
    "smtp_port" INTEGER NOT NULL DEFAULT 465,
    "smtp_user" TEXT NOT NULL,
    "smtp_pass" TEXT NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "reject_unauthorized" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_accounts_user_id_idx" ON "mail_accounts"("user_id");

-- AddForeignKey
ALTER TABLE "mail_accounts" ADD CONSTRAINT "mail_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
