CREATE TABLE "PortfolioReviewDecision" (
    "id" UUID NOT NULL,
    "competencyId" TEXT NOT NULL,
    "competencyCode" TEXT NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerQualification" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioReviewDecision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PortfolioReviewDecision_kind_check" CHECK ("kind" IN ('cultural', 'native_speaker')),
    CONSTRAINT "PortfolioReviewDecision_decision_check" CHECK ("decision" IN ('approved', 'rejected'))
);
CREATE UNIQUE INDEX "PortfolioReviewDecision_reviewerId_requestKey_key" ON "PortfolioReviewDecision"("reviewerId", "requestKey");
CREATE INDEX "PortfolioReviewDecision_competencyCode_contentVersion_kind_createdAt_idx" ON "PortfolioReviewDecision"("competencyCode", "contentVersion", "kind", "createdAt");
ALTER TABLE "PortfolioReviewDecision" ADD CONSTRAINT "PortfolioReviewDecision_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION ecla_portfolio_review_append_only() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Portfolio review decisions are append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER portfolio_review_append_only BEFORE UPDATE ON "PortfolioReviewDecision" FOR EACH ROW EXECUTE FUNCTION ecla_portfolio_review_append_only();
