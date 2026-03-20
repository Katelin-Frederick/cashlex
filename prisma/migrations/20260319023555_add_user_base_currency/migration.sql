-- AlterTable
ALTER TABLE "User" ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'USD';

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
