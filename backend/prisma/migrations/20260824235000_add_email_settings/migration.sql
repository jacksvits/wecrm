-- CreateTable: email_settings stores IMAP configuration for the email worker
CREATE TABLE "email_settings" (
    "id" TEXT NOT NULL,
    "imapHost" TEXT NOT NULL,
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "imapUser" TEXT NOT NULL,
    "imapPass" TEXT NOT NULL,
    "checkIntervalMs" INTEGER NOT NULL DEFAULT 60000,
    "processedFolder" TEXT,
    "defaultCreatorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);
