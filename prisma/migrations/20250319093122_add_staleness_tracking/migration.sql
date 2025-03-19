-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Availability_productId_createdAt_idx" ON "Availability"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "Price_productId_createdAt_idx" ON "Price"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_providerName_providerId_idx" ON "Product"("providerName", "providerId");

-- CreateIndex
CREATE INDEX "Product_isStale_idx" ON "Product"("isStale");
