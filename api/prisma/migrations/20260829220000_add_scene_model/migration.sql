-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "timeOfDay" TEXT,
    "mood" TEXT,
    "objective" TEXT NOT NULL,
    "mission" TEXT,
    "context" JSONB NOT NULL DEFAULT '{}',
    "characters" JSONB NOT NULL DEFAULT '[]',
    "language" JSONB NOT NULL DEFAULT '{}',
    "activities" JSONB NOT NULL DEFAULT '[]',
    "variations" JSONB NOT NULL DEFAULT '[]',
    "transfer" JSONB,
    "assessment" JSONB,
    "mastery" JSONB,
    "metadata" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scene_slug_key" ON "Scene"("slug");

-- CreateIndex
CREATE INDEX "Scene_competencyId_idx" ON "Scene"("competencyId");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
