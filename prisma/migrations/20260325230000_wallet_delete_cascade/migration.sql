-- Transaction: cascade delete when wallet is deleted
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RecurringExpense: set null when wallet is deleted
ALTER TABLE "RecurringExpense" DROP CONSTRAINT "RecurringExpense_walletId_fkey";
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
