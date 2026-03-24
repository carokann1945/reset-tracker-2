/*
  Warnings:

  - You are about to drop the column `migrationCompletedAt` on the `TrackerSnapshot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TrackerSnapshot" DROP COLUMN "migrationCompletedAt";
