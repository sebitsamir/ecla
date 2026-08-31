-- CreateTable
CREATE TABLE "AssessmentSceneVersion" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "educatorReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentSceneVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "sceneVersionId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "activeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL,
    "supportedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "retentionEligible" BOOLEAN NOT NULL DEFAULT false,
    "contextNovel" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LearningAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "responseKey" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "dimension" TEXT,
    "supported" BOOLEAN NOT NULL,
    "repair" BOOLEAN NOT NULL DEFAULT false,
    "evaluatorVersion" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSceneVersion_sceneId_version_key" ON "AssessmentSceneVersion"("sceneId", "version");

-- CreateIndex
CREATE INDEX "LearningAttempt_userId_competencyId_completedAt_idx" ON "LearningAttempt"("userId", "competencyId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningAttempt_userId_idempotencyKey_key" ON "LearningAttempt"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LearningAttempt_userId_activeKey_key" ON "LearningAttempt"("userId", "activeKey");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptResponse_attemptId_sequence_key" ON "AttemptResponse"("attemptId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptResponse_attemptId_responseKey_key" ON "AttemptResponse"("attemptId", "responseKey");

-- AddForeignKey
ALTER TABLE "AssessmentSceneVersion" ADD CONSTRAINT "AssessmentSceneVersion_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSceneVersion" ADD CONSTRAINT "AssessmentSceneVersion_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "LearningExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAttempt" ADD CONSTRAINT "LearningAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAttempt" ADD CONSTRAINT "LearningAttempt_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAttempt" ADD CONSTRAINT "LearningAttempt_sceneVersionId_fkey" FOREIGN KEY ("sceneVersionId") REFERENCES "AssessmentSceneVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptResponse" ADD CONSTRAINT "AttemptResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "LearningAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
