-- Restore the schema boundary that existed before Phase 31.
-- Fresh databases contain only empty legacy curriculum tables at this point.
-- Accumulated databases already containing Competency skip the bootstrap.
DO $$
BEGIN
  IF to_regclass('"Competency"') IS NULL THEN
    IF EXISTS (SELECT 1 FROM "Course" LIMIT 1) OR
       EXISTS (SELECT 1 FROM "Unit" LIMIT 1) OR
       EXISTS (SELECT 1 FROM "Concept" LIMIT 1) OR
       EXISTS (SELECT 1 FROM "UserProgress" LIMIT 1) OR
       EXISTS (SELECT 1 FROM "Vocabulary" LIMIT 1) OR
       EXISTS (SELECT 1 FROM "UserVocabProgress" LIMIT 1) OR
       EXISTS (SELECT 1 FROM "StreakLog" LIMIT 1) THEN
      RAISE EXCEPTION 'Legacy curriculum data requires an explicit v3-to-v4 data migration; refusing destructive bootstrap';
    END IF;
  END IF;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;

DO $$ BEGIN
  CREATE TYPE "ExperienceType" AS ENUM ('STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL', 'MISSION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "MasteryLevel" AS ENUM ('NOT_STARTED', 'EXPOSED', 'DEVELOPING', 'CONTROLLED', 'TRANSFERRED', 'RETAINED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  IF to_regclass('"Competency"') IS NULL THEN
    DROP TABLE IF EXISTS "SubLesson", "LessonVariant", "ConceptMastery", "UserProgress",
      "Concept", "UserVocabProgress", "Vocabulary", "StreakLog", "Unit", "Course" CASCADE;
  END IF;
END $$;
-- CreateTable
CREATE TABLE IF NOT EXISTS "CharacterMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "encounters" INTEGER NOT NULL DEFAULT 1,
    "firstMetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "ttsLocale" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "cefrLevel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Unit" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Competency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "canDo" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "xpReward" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompetencyPrerequisite" (
    "competencyId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "CompetencyPrerequisite_pkey" PRIMARY KEY ("competencyId","prerequisiteId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanguageRealization" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "functionNote" TEXT,
    "grammarNote" TEXT,
    "pronunciationNote" TEXT,
    "culturalNote" TEXT,
    "patterns" JSONB NOT NULL DEFAULT '[]',
    "examples" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "LanguageRealization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Vocabulary" (
    "id" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "audioUrl" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompetencyVocabulary" (
    "competencyId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CompetencyVocabulary_pkey" PRIMARY KEY ("competencyId","vocabularyId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearningExperience" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "type" "ExperienceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL DEFAULT '{}',
    "assessment" JSONB,
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserExperienceProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "score" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "UserExperienceProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Mission" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "successCriteria" JSONB NOT NULL,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MissionAttempt" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "evidence" JSONB,
    "feedback" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompetencyMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "level" "MasteryLevel" NOT NULL DEFAULT 'NOT_STARTED',
    "exposureCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "contexts" JSONB,
    "repairsCompleted" INTEGER NOT NULL DEFAULT 0,
    "comprehensionScore" DOUBLE PRECISION,
    "retrievalScore" DOUBLE PRECISION,
    "interactionScore" DOUBLE PRECISION,
    "applicationScore" DOUBLE PRECISION,
    "transferScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "retentionScore" DOUBLE PRECISION,
    "lastAssessedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),

    CONSTRAINT "CompetencyMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserVocabProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVocabProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StreakLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "lessonsDone" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StreakLog_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CharacterMemory_userId_characterId_key" ON "CharacterMemory"("userId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Course_languageId_cefrLevel_key" ON "Course"("languageId", "cefrLevel");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Unit_courseId_orderIndex_key" ON "Unit"("courseId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Competency_code_key" ON "Competency"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competency_unitId_orderIndex_idx" ON "Competency"("unitId", "orderIndex");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetencyPrerequisite_prerequisiteId_idx" ON "CompetencyPrerequisite"("prerequisiteId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LanguageRealization_languageId_idx" ON "LanguageRealization"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LanguageRealization_competencyId_languageId_key" ON "LanguageRealization"("competencyId", "languageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vocabulary_languageId_word_idx" ON "Vocabulary"("languageId", "word");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetencyVocabulary_vocabularyId_idx" ON "CompetencyVocabulary"("vocabularyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearningExperience_competencyId_type_idx" ON "LearningExperience"("competencyId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearningExperience_competencyId_orderIndex_idx" ON "LearningExperience"("competencyId", "orderIndex");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserExperienceProgress_userId_status_idx" ON "UserExperienceProgress"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserExperienceProgress_userId_experienceId_key" ON "UserExperienceProgress"("userId", "experienceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Mission_competencyId_idx" ON "Mission"("competencyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MissionAttempt_userId_missionId_idx" ON "MissionAttempt"("userId", "missionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MissionAttempt_missionId_idx" ON "MissionAttempt"("missionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetencyMastery_userId_level_idx" ON "CompetencyMastery"("userId", "level");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetencyMastery_userId_competencyId_idx" ON "CompetencyMastery"("userId", "competencyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompetencyMastery_userId_competencyId_key" ON "CompetencyMastery"("userId", "competencyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserVocabProgress_userId_nextReviewAt_idx" ON "UserVocabProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserVocabProgress_userId_vocabId_key" ON "UserVocabProgress"("userId", "vocabId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StreakLog_userId_date_idx" ON "StreakLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StreakLog_userId_date_key" ON "StreakLog"("userId", "date");


-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Course_languageId_fkey') THEN
  ALTER TABLE "Course" ADD CONSTRAINT "Course_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Unit_courseId_fkey') THEN
  ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Competency_unitId_fkey') THEN
  ALTER TABLE "Competency" ADD CONSTRAINT "Competency_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompetencyPrerequisite_competencyId_fkey') THEN
  ALTER TABLE "CompetencyPrerequisite" ADD CONSTRAINT "CompetencyPrerequisite_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompetencyPrerequisite_prerequisiteId_fkey') THEN
  ALTER TABLE "CompetencyPrerequisite" ADD CONSTRAINT "CompetencyPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LanguageRealization_competencyId_fkey') THEN
  ALTER TABLE "LanguageRealization" ADD CONSTRAINT "LanguageRealization_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LanguageRealization_languageId_fkey') THEN
  ALTER TABLE "LanguageRealization" ADD CONSTRAINT "LanguageRealization_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vocabulary_languageId_fkey') THEN
  ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompetencyVocabulary_competencyId_fkey') THEN
  ALTER TABLE "CompetencyVocabulary" ADD CONSTRAINT "CompetencyVocabulary_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompetencyVocabulary_vocabularyId_fkey') THEN
  ALTER TABLE "CompetencyVocabulary" ADD CONSTRAINT "CompetencyVocabulary_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearningExperience_competencyId_fkey') THEN
  ALTER TABLE "LearningExperience" ADD CONSTRAINT "LearningExperience_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserExperienceProgress_userId_fkey') THEN
  ALTER TABLE "UserExperienceProgress" ADD CONSTRAINT "UserExperienceProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserExperienceProgress_experienceId_fkey') THEN
  ALTER TABLE "UserExperienceProgress" ADD CONSTRAINT "UserExperienceProgress_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Mission_competencyId_fkey') THEN
  ALTER TABLE "Mission" ADD CONSTRAINT "Mission_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MissionAttempt_missionId_fkey') THEN
  ALTER TABLE "MissionAttempt" ADD CONSTRAINT "MissionAttempt_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MissionAttempt_userId_fkey') THEN
  ALTER TABLE "MissionAttempt" ADD CONSTRAINT "MissionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompetencyMastery_userId_fkey') THEN
  ALTER TABLE "CompetencyMastery" ADD CONSTRAINT "CompetencyMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompetencyMastery_competencyId_fkey') THEN
  ALTER TABLE "CompetencyMastery" ADD CONSTRAINT "CompetencyMastery_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserVocabProgress_userId_fkey') THEN
  ALTER TABLE "UserVocabProgress" ADD CONSTRAINT "UserVocabProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserVocabProgress_vocabId_fkey') THEN
  ALTER TABLE "UserVocabProgress" ADD CONSTRAINT "UserVocabProgress_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StreakLog_userId_fkey') THEN
  ALTER TABLE "StreakLog" ADD CONSTRAINT "StreakLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;
