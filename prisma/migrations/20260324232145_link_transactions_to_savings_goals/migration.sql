-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "savingsGoalId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_savingsGoalId_idx" ON "Transaction"("savingsGoalId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "SavingsGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
