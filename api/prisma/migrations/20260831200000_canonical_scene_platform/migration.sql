-- CreateTable
CREATE TABLE "SceneRevision" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "compilerVersion" TEXT NOT NULL,
    "source" JSONB NOT NULL,
    "compiled" JSONB NOT NULL,
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SceneRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenePublication" (
    "sceneId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenePublication_pkey" PRIMARY KEY ("sceneId")
);

-- CreateTable
CREATE TABLE "SceneRevisionEvent" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SceneRevisionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "experimentKey" TEXT,
    "variant" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SceneVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SceneRevision_sceneId_version_key" ON "SceneRevision"("sceneId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ScenePublication_revisionId_key" ON "ScenePublication"("revisionId");

-- CreateIndex
CREATE INDEX "SceneRevisionEvent_revisionId_createdAt_idx" ON "SceneRevisionEvent"("revisionId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneVisit_revisionId_createdAt_idx" ON "SceneVisit"("revisionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SceneVisit_userId_requestKey_key" ON "SceneVisit"("userId", "requestKey");

-- AddForeignKey
ALTER TABLE "SceneRevision" ADD CONSTRAINT "SceneRevision_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenePublication" ADD CONSTRAINT "ScenePublication_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenePublication" ADD CONSTRAINT "ScenePublication_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SceneRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneRevisionEvent" ADD CONSTRAINT "SceneRevisionEvent_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SceneRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneVisit" ADD CONSTRAINT "SceneVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneVisit" ADD CONSTRAINT "SceneVisit_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SceneRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Content identity cannot be rewritten after creation; review metadata may change.
CREATE FUNCTION ecla_scene_revision_immutable() RETURNS trigger AS $$
BEGIN
  IF ROW(NEW."sceneId", NEW.version, NEW."schemaVersion", NEW."compilerVersion", NEW.source, NEW.compiled, NEW."createdBy", NEW."createdAt")
     IS DISTINCT FROM ROW(OLD."sceneId", OLD.version, OLD."schemaVersion", OLD."compilerVersion", OLD.source, OLD.compiled, OLD."createdBy", OLD."createdAt") THEN
    RAISE EXCEPTION 'Scene revision content is immutable; create a new revision';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER scene_revision_immutable BEFORE UPDATE ON "SceneRevision"
FOR EACH ROW EXECUTE FUNCTION ecla_scene_revision_immutable();
