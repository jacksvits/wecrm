-- CreateTable
CREATE TABLE "legal_documents" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "offer" TEXT NOT NULL DEFAULT '',
    "privacy" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);
INSERT INTO "legal_documents" ("id", "offer", "privacy", "created_at", "updated_at")
VALUES (1, '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
