/*
  Warnings:

  - Made the column `validatorId` on table `WebsiteTicks` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "WebsiteTicks" DROP CONSTRAINT "WebsiteTicks_validatorId_fkey";

-- AlterTable
ALTER TABLE "WebsiteTicks" ALTER COLUMN "validatorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "WebsiteTicks" ADD CONSTRAINT "WebsiteTicks_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
