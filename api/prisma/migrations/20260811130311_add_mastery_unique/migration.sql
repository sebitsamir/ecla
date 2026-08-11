/*
  Warnings:

  - A unique constraint covering the columns `[userId,conceptId]` on the table `ConceptMastery` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ConceptMastery_userId_conceptId_key" ON "ConceptMastery"("userId", "conceptId");
