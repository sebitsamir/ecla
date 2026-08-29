-- Phase 31-37: Character memory expansion, learner events, performance tracking
ALTER TABLE "CharacterMemory"
ADD COLUMN IF NOT EXISTS "personality" TEXT,
ADD COLUMN IF NOT EXISTS "occupation" TEXT,
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "relationship" TEXT DEFAULT 'stranger',
ADD COLUMN IF NOT EXISTS "memories" JSONB;

ALTER TABLE "CompetencyMastery"
ADD COLUMN IF NOT EXISTS "confidenceLevel" INTEGER,
ADD COLUMN IF NOT EXISTS "performanceJson" JSONB;

CREATE TABLE IF NOT EXISTS "LearnerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LearnerEvent_userId_type_idx" ON "LearnerEvent"("userId", "type");
CREATE INDEX IF NOT EXISTS "LearnerEvent_userId_competencyId_idx" ON "LearnerEvent"("userId", "competencyId");
