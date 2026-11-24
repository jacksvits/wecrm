-- AlterTable
ALTER TABLE "organization_requisites" ADD COLUMN "taxSystem" TEXT NOT NULL DEFAULT 'osno';

-- AlterTable
ALTER TABLE "organization_requisites" ADD COLUMN "vatRate" TEXT NOT NULL DEFAULT 'none';
