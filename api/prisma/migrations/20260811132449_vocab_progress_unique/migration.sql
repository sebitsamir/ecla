/*
  Warnings:

  - A unique constraint covering the columns `[userId,vocabId]` on the table `UserVocabProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserVocabProgress_userId_vocabId_key" ON "UserVocabProgress"("userId", "vocabId");
