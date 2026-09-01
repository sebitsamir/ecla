-- CreateTable
CREATE TABLE "AssessmentRubric" (
    "id" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "evaluatorVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,

    CONSTRAINT "AssessmentRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "missionId" TEXT,
    "competencyId" TEXT,
    "rubricId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "activeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "scenarioOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentScenario" INTEGER NOT NULL DEFAULT 0,
    "eligibilitySnapshot" JSONB NOT NULL,
    "curriculumVersion" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "finalDecision" JSONB,

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSessionTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "responseKey" TEXT,
    "replyToKey" TEXT,
    "repair" BOOLEAN NOT NULL DEFAULT false,
    "providerModel" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentSessionTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScenarioResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "objectiveAchieved" BOOLEAN NOT NULL,
    "meaningCommunicated" BOOLEAN NOT NULL,
    "comprehensionEvidence" DOUBLE PRECISION NOT NULL,
    "repairEvidence" BOOLEAN NOT NULL,
    "independence" DOUBLE PRECISION NOT NULL,
    "intelligibility" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "autoQualifies" BOOLEAN NOT NULL,
    "humanDecision" BOOLEAN,
    "humanConfidence" DOUBLE PRECISION,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "evidence" JSONB NOT NULL,
    "evaluatorVersion" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentScenarioResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcousticObservation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "providerVersion" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "consentAttested" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "reviewNote" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcousticObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAudit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "rubricId" TEXT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentRubric_targetKey_status_idx" ON "AssessmentRubric"("targetKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRubric_targetKey_version_key" ON "AssessmentRubric"("targetKey", "version");

-- CreateIndex
CREATE INDEX "AssessmentSession_userId_kind_completedAt_idx" ON "AssessmentSession"("userId", "kind", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSession_userId_idempotencyKey_key" ON "AssessmentSession"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSession_userId_activeKey_key" ON "AssessmentSession"("userId", "activeKey");

-- CreateIndex
CREATE INDEX "AssessmentSessionTurn_sessionId_scenarioId_sequence_idx" ON "AssessmentSessionTurn"("sessionId", "scenarioId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSessionTurn_sessionId_sequence_key" ON "AssessmentSessionTurn"("sessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSessionTurn_sessionId_responseKey_key" ON "AssessmentSessionTurn"("sessionId", "responseKey");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSessionTurn_sessionId_replyToKey_key" ON "AssessmentSessionTurn"("sessionId", "replyToKey");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentScenarioResult_sessionId_scenarioId_key" ON "AssessmentScenarioResult"("sessionId", "scenarioId");

-- CreateIndex
CREATE INDEX "AcousticObservation_sessionId_scenarioId_idx" ON "AcousticObservation"("sessionId", "scenarioId");

-- CreateIndex
CREATE INDEX "AssessmentAudit_sessionId_createdAt_idx" ON "AssessmentAudit"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentAudit_rubricId_createdAt_idx" ON "AssessmentAudit"("rubricId", "createdAt");

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "AssessmentRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSessionTurn" ADD CONSTRAINT "AssessmentSessionTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScenarioResult" ADD CONSTRAINT "AssessmentScenarioResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScenarioResult" ADD CONSTRAINT "AssessmentScenarioResult_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "AssessmentRubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcousticObservation" ADD CONSTRAINT "AcousticObservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAudit" ADD CONSTRAINT "AssessmentAudit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAudit" ADD CONSTRAINT "AssessmentAudit_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "AssessmentRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Assessment source evidence and audit facts are append-only. Review fields remain updateable.
CREATE FUNCTION ecla_assessment_rubric_immutable() RETURNS trigger AS $$ BEGIN
 IF ROW(NEW."targetKey", NEW.version, NEW.definition, NEW."evaluatorVersion", NEW."createdBy", NEW."createdAt") IS DISTINCT FROM ROW(OLD."targetKey", OLD.version, OLD.definition, OLD."evaluatorVersion", OLD."createdBy", OLD."createdAt") THEN RAISE EXCEPTION 'Assessment rubric content is immutable'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER assessment_rubric_immutable BEFORE UPDATE ON "AssessmentRubric" FOR EACH ROW EXECUTE FUNCTION ecla_assessment_rubric_immutable();
CREATE FUNCTION ecla_assessment_session_immutable() RETURNS trigger AS $$ BEGIN
 IF ROW(NEW."userId", NEW.kind, NEW."missionId", NEW."competencyId", NEW."rubricId", NEW."idempotencyKey", NEW."scenarioOrder", NEW."eligibilitySnapshot", NEW."curriculumVersion", NEW."startedAt") IS DISTINCT FROM ROW(OLD."userId", OLD.kind, OLD."missionId", OLD."competencyId", OLD."rubricId", OLD."idempotencyKey", OLD."scenarioOrder", OLD."eligibilitySnapshot", OLD."curriculumVersion", OLD."startedAt") THEN RAISE EXCEPTION 'Assessment session identity and eligibility are immutable'; END IF;
 IF OLD."finalDecision" IS NOT NULL AND NEW."finalDecision" IS DISTINCT FROM OLD."finalDecision" THEN RAISE EXCEPTION 'Assessment final decision is immutable'; END IF;
 IF OLD."completedAt" IS NOT NULL AND NEW."completedAt" IS DISTINCT FROM OLD."completedAt" THEN RAISE EXCEPTION 'Assessment completion time is immutable'; END IF;
 RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER assessment_session_immutable BEFORE UPDATE ON "AssessmentSession" FOR EACH ROW EXECUTE FUNCTION ecla_assessment_session_immutable();
CREATE FUNCTION ecla_assessment_fact_immutable() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Assessment evidence is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER assessment_turn_immutable BEFORE UPDATE ON "AssessmentSessionTurn" FOR EACH ROW EXECUTE FUNCTION ecla_assessment_fact_immutable();
CREATE TRIGGER acoustic_observation_immutable BEFORE UPDATE ON "AcousticObservation" FOR EACH ROW EXECUTE FUNCTION ecla_assessment_fact_immutable();
CREATE TRIGGER assessment_audit_immutable BEFORE UPDATE ON "AssessmentAudit" FOR EACH ROW EXECUTE FUNCTION ecla_assessment_fact_immutable();
CREATE FUNCTION ecla_assessment_result_observation_immutable() RETURNS trigger AS $$ BEGIN
 IF ROW(NEW."sessionId", NEW."scenarioId", NEW."rubricId", NEW."objectiveAchieved", NEW."meaningCommunicated", NEW."comprehensionEvidence", NEW."repairEvidence", NEW.independence, NEW.confidence, NEW."autoQualifies", NEW.evidence, NEW."evaluatorVersion", NEW."evaluatedAt") IS DISTINCT FROM ROW(OLD."sessionId", OLD."scenarioId", OLD."rubricId", OLD."objectiveAchieved", OLD."meaningCommunicated", OLD."comprehensionEvidence", OLD."repairEvidence", OLD.independence, OLD.confidence, OLD."autoQualifies", OLD.evidence, OLD."evaluatorVersion", OLD."evaluatedAt") THEN RAISE EXCEPTION 'Observed assessment result is immutable'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER assessment_result_observation_immutable BEFORE UPDATE ON "AssessmentScenarioResult" FOR EACH ROW EXECUTE FUNCTION ecla_assessment_result_observation_immutable();
