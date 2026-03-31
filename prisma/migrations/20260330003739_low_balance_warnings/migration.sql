-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsLowBalance" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "lowBalanceAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lowBalanceAlertSentAt" TIMESTAMP(3),
ADD COLUMN     "lowBalanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 100;
