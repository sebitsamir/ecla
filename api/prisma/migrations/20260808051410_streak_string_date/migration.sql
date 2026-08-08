/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `StreakLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StreakLog" ALTER COLUMN "date" SET DATA TYPE TEXT,
ALTER COLUMN "xpEarned" SET DEFAULT 0,
ALTER COLUMN "lessonsDone" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "StreakLog_userId_date_key" ON "StreakLog"("userId", "date");
