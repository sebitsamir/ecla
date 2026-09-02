CREATE TABLE "PilotStudy" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL,
  "protocolVersion" TEXT NOT NULL, "consentVersion" TEXT NOT NULL, "consentTextHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft', "targetMin" INTEGER NOT NULL DEFAULT 20,
  "targetMax" INTEGER NOT NULL DEFAULT 30, "durationWeeks" INTEGER NOT NULL,
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), CONSTRAINT "PilotStudy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PilotStudy_slug_key" ON "PilotStudy"("slug");

CREATE TABLE "PilotParticipant" (
  "id" TEXT NOT NULL, "studyId" TEXT NOT NULL, "userId" TEXT NOT NULL, "participantCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'invited', "beginnerVerifiedBy" TEXT NOT NULL,
  "beginnerVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "eligibilityInstrument" TEXT NOT NULL,
  "consentVersion" TEXT, "consentedAt" TIMESTAMP(3), "withdrawnAt" TIMESTAMP(3), "withdrawalReason" TEXT,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PilotParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PilotParticipant_studyId_userId_key" ON "PilotParticipant"("studyId", "userId");
CREATE UNIQUE INDEX "PilotParticipant_studyId_participantCode_key" ON "PilotParticipant"("studyId", "participantCode");
CREATE INDEX "PilotParticipant_studyId_status_idx" ON "PilotParticipant"("studyId", "status");

CREATE TABLE "PilotPrediction" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "competencyCode" TEXT, "situationId" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL, "predictedMastery" DOUBLE PRECISION NOT NULL, "evidenceCutoffAt" TIMESTAMP(3) NOT NULL,
  "lockedBy" TEXT NOT NULL, "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotPrediction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PilotPrediction_participantId_situationId_modelVersion_key" ON "PilotPrediction"("participantId", "situationId", "modelVersion");
CREATE INDEX "PilotPrediction_participantId_lockedAt_idx" ON "PilotPrediction"("participantId", "lockedAt");

CREATE TABLE "PilotMeasurement" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "kind" TEXT NOT NULL, "week" INTEGER,
  "competencyCode" TEXT, "situationId" TEXT, "instrumentVersion" TEXT NOT NULL,
  "predictedMastery" DOUBLE PRECISION, "predictionId" TEXT, "observedPerformance" DOUBLE PRECISION NOT NULL,
  "assessorId" TEXT NOT NULL, "assessorIndependent" BOOLEAN NOT NULL DEFAULT false,
  "evidenceReference" TEXT NOT NULL, "requestKey" TEXT NOT NULL, "notes" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotMeasurement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PilotMeasurement_participantId_requestKey_key" ON "PilotMeasurement"("participantId", "requestKey");
CREATE UNIQUE INDEX "PilotMeasurement_predictionId_key" ON "PilotMeasurement"("predictionId");
CREATE INDEX "PilotMeasurement_participantId_kind_observedAt_idx" ON "PilotMeasurement"("participantId", "kind", "observedAt");
CREATE INDEX "PilotMeasurement_competencyCode_kind_idx" ON "PilotMeasurement"("competencyCode", "kind");

CREATE TABLE "PilotInterview" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "week" INTEGER NOT NULL, "interviewerId" TEXT NOT NULL,
  "instrumentVersion" TEXT NOT NULL, "codedThemes" JSONB NOT NULL, "summary" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL, "conductedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PilotInterview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PilotInterview_participantId_week_key" ON "PilotInterview"("participantId", "week");
CREATE UNIQUE INDEX "PilotInterview_participantId_requestKey_key" ON "PilotInterview"("participantId", "requestKey");

CREATE TABLE "PilotRevision" (
  "id" TEXT NOT NULL, "studyId" TEXT NOT NULL, "actor" TEXT NOT NULL, "decision" TEXT NOT NULL,
  "rationale" TEXT NOT NULL, "affectedVersions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PilotRevision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PilotRevision_studyId_createdAt_idx" ON "PilotRevision"("studyId", "createdAt");

ALTER TABLE "PilotParticipant" ADD CONSTRAINT "PilotParticipant_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "PilotStudy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PilotParticipant" ADD CONSTRAINT "PilotParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotPrediction" ADD CONSTRAINT "PilotPrediction_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "PilotParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotMeasurement" ADD CONSTRAINT "PilotMeasurement_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "PilotParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotMeasurement" ADD CONSTRAINT "PilotMeasurement_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "PilotPrediction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PilotInterview" ADD CONSTRAINT "PilotInterview_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "PilotParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotRevision" ADD CONSTRAINT "PilotRevision_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "PilotStudy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
