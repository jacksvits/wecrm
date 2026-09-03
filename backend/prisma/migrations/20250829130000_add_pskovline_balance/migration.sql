-- CreateTable
CREATE TABLE "pskovline_balances" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION,
    "period" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pskovline_balances_pkey" PRIMARY KEY ("id")
);

