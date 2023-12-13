/*
  Warnings:

  - A unique constraint covering the columns `[deviceId]` on the table `UserSessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceId` to the `UserSessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSessions" ADD COLUMN     "deviceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSessions_deviceId_key" ON "UserSessions"("deviceId");
