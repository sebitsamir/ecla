-- Reconcile migration-created types and identifiers with schema.prisma.
ALTER TABLE "LearnerPlanSnapshot" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "PortfolioReviewDecision" ALTER COLUMN "id" SET DATA TYPE TEXT;

DO $$
BEGIN
  IF to_regclass('"PortfolioReviewDecision_competencyCode_contentVersion_kind_crea"') IS NOT NULL
     AND to_regclass('"PortfolioReviewDecision_competencyCode_contentVersion_kind__idx"') IS NULL THEN
    ALTER INDEX "PortfolioReviewDecision_competencyCode_contentVersion_kind_crea"
      RENAME TO "PortfolioReviewDecision_competencyCode_contentVersion_kind__idx";
  END IF;
END $$;
