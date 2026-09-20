CREATE TABLE "EvidenceObservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "competencyVersion" TEXT NOT NULL,
    "taskVersion" TEXT NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "contextFingerprint" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "rawResponseRef" TEXT,
    "allowedAssistance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usedAssistance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcome" JSONB NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "evaluatorVersion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "reviewState" TEXT NOT NULL DEFAULT 'unreviewed',
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceObservation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EvidenceObservation_userId_competencyId_observedAt_idx" ON "EvidenceObservation"("userId", "competencyId", "observedAt");
CREATE INDEX "EvidenceObservation_competencyId_contextFingerprint_idx" ON "EvidenceObservation"("competencyId", "contextFingerprint");
CREATE INDEX "EvidenceObservation_reviewState_purpose_idx" ON "EvidenceObservation"("reviewState", "purpose");
ALTER TABLE "EvidenceObservation" ADD CONSTRAINT "EvidenceObservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceObservation" ADD CONSTRAINT "EvidenceObservation_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
