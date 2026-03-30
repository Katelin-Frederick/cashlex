-- AlterTable
ALTER TABLE "RecurringExpense" ADD COLUMN     "reminderDaysAhead" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderSentForDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsBillReminder" BOOLEAN NOT NULL DEFAULT true;
