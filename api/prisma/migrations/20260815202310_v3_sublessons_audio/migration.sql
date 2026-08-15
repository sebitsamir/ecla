-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN     "ttsLang" TEXT NOT NULL DEFAULT 'es-ES';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "equippedCosmetic" TEXT NOT NULL DEFAULT 'gold',
ADD COLUMN     "unlockedCosmetics" TEXT[] DEFAULT ARRAY['gold']::TEXT[];

-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "subLessonId" TEXT;

-- CreateTable
CREATE TABLE "SubLesson" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'sparkles',
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "teach" JSONB NOT NULL DEFAULT '[]',
    "exercises" JSONB NOT NULL DEFAULT '[]',
    "realLife" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubLesson_conceptId_orderIndex_key" ON "SubLesson"("conceptId", "orderIndex");

-- AddForeignKey
ALTER TABLE "SubLesson" ADD CONSTRAINT "SubLesson_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
