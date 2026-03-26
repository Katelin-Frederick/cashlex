-- AlterTable
ALTER TABLE "Debt" ADD COLUMN "walletId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Debt_walletId_key" ON "Debt"("walletId");

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
