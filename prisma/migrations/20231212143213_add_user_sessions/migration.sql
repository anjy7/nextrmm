/*
  Warnings:

  - You are about to drop the column `deviceId` on the `UserSessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `UserSessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `region` to the `UserSessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `UserSessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserSessions" DROP CONSTRAINT "UserSessions_deviceId_fkey";

-- DropIndex
DROP INDEX "UserSessions_deviceId_key";

-- AlterTable
ALTER TABLE "UserSessions" DROP COLUMN "deviceId",
ADD COLUMN     "region" TEXT NOT NULL,
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSessions_sessionId_key" ON "UserSessions"("sessionId");

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
