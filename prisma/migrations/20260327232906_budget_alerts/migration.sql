-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertSentAt" TIMESTAMP(3),
ADD COLUMN     "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsBudgetAlert" BOOLEAN NOT NULL DEFAULT true;
