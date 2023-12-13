/*
  Warnings:

  - You are about to drop the column `device` on the `UserSessions` table. All the data in the column will be lost.
  - Added the required column `deviceType` to the `UserSessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSessions" DROP COLUMN "device",
ADD COLUMN     "deviceType" TEXT NOT NULL;
