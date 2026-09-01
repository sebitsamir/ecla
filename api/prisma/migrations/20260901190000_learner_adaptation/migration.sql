CREATE TABLE "LearnerPlanSnapshot" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "evidenceVersion" TEXT NOT NULL,
    "plan" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearnerPlanSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LearnerPlanSnapshot_userId_generatedAt_idx" ON "LearnerPlanSnapshot"("userId", "generatedAt");
CREATE UNIQUE INDEX "LearnerPlanSnapshot_userId_evidenceVersion_key" ON "LearnerPlanSnapshot"("userId", "evidenceVersion");
ALTER TABLE "LearnerPlanSnapshot" ADD CONSTRAINT "LearnerPlanSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE FUNCTION ecla_learner_plan_immutable() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Learner plan snapshots are immutable'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER learner_plan_immutable BEFORE UPDATE ON "LearnerPlanSnapshot" FOR EACH ROW EXECUTE FUNCTION ecla_learner_plan_immutable();
