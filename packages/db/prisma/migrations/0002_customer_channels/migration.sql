-- AlterTable
ALTER TABLE "customer"
ADD COLUMN "channels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
