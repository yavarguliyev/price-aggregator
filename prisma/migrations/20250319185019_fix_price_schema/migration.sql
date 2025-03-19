/*
  Warnings:

  - You are about to drop the column `value` on the `Price` table. All the data in the column will be lost.
  - You are about to drop the column `providerName` on the `Product` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Price` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Availability_productId_createdAt_idx";

-- DropIndex
DROP INDEX "Price_productId_createdAt_idx";

-- DropIndex
DROP INDEX "Product_isStale_idx";

-- DropIndex
DROP INDEX "Product_providerName_providerId_idx";

-- AlterTable
ALTER TABLE "Availability" ALTER COLUMN "isAvailable" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Price" DROP COLUMN "value",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "providerName",
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Availability_productId_idx" ON "Availability"("productId");

-- CreateIndex
CREATE INDEX "Price_productId_idx" ON "Price"("productId");

-- CreateIndex
CREATE INDEX "Product_providerId_idx" ON "Product"("providerId");

-- CreateIndex
CREATE INDEX "Product_lastFetchedAt_idx" ON "Product"("lastFetchedAt");
