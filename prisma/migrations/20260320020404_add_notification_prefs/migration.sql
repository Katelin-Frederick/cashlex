-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsDigest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotificationsReceipt" BOOLEAN NOT NULL DEFAULT true;
