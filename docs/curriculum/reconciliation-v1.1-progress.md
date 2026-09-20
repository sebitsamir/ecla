# ECLA curriculum reconciliation v1.1

Updated: 20 September 2026

This file records implementation state. It does not claim educational validation, publication approval, professional audio delivery, or proven learning effectiveness.

## Baseline audit

- The repository had 44 seeded Spanish Pre-A1 competency IDs across nine navigation units.
- The six stored mastery states already matched the reconciled specification.
- Versioned scenes, immutable revisions, reviewed publication, learner attempts, Gateway rubrics, and server-owned grading already existed.
- The old 44-entry portfolio had three contexts per competency and pending cultural/native-speaker review.
- Semantic conflicts existed for personal profile/role, object naming/presence, time words/clock time, location questions/answers/routes, word meaning/missing-detail questions, and three Gateway labels.
- Existing generic completion paths do not establish transferred or retained mastery; the reviewed assessment paths remain authoritative.
- A previous local-access patch exposed draft scenes globally and removed publication blockers. It is now constrained to non-production draft preview while exact-revision, cultural, and native-speaker publication checks remain enforced.

## Implemented

- Phase 1: baseline inventory and conflict audit.
- Phase 2: typed, versioned 60-record registry with 44 retained IDs, the exact 16 additions, facets, evidence dimensions, and typed prerequisite reasons.
- Phase 3: source-qualified migration manifest and fail-closed dry-run API. No evidence or database row is automatically reassigned.
- Phase 4: complete draft benchmark packages for greetings, water requests, and misunderstanding repair. Each has two developed practice contexts, two held-out transfer contexts, contingent branches, spoken and written output, alternative valid responses, remediation, and 7/30-day retention checks.
- Phase 5: durable evidence-observation schema and service contract for competency/content/task versions, context, modality, assistance, practical outcome, evaluator/rubric, confidence, purpose, review state, and timestamp. The migration file is authored but has not been applied.
- Phase 6: registry, manifest, portfolio, benchmark, evidence-contract, and retention validation tests.
- Phase 7: all 60 competencies have authored draft portfolio entries; the known semantic conflicts are reconciled in the canonical portfolio view. All external review states remain pending.
- Phase 8: validation and reporting are complete for the local, database-independent implementation.

## Verification completed

- API TypeScript typecheck: passed.
- API unit tests: 46 passed, 0 failed.
- Web lint: passed with zero warnings.
- Web TypeScript typecheck: passed.
- Web unit tests: 29 passed, 0 failed.
- Reconciliation validator: registry, migration manifest, portfolio, and benchmark packages passed.
- Portfolio validator: 60 competencies, 180 authored contexts, and 120 pending review slots passed.
- Prisma schema validation: passed.
- Git whitespace validation: passed.

The isolated integration suite was not executed because its safety guard requires a dedicated local database at `localhost:55439/ecla_phase1_test`, which was not available. The guard stopped before connecting or writing. The three benchmark flows were therefore verified structurally and through unit contracts, but not manually exercised against a migrated local database in this session.

## Database and release safety

- No schema migration, curriculum reseed, scene seed, evidence migration, publication, deployment, merge, or push was performed for this reconciliation.
- The SQL migration is reviewable at `api/prisma/migrations/20260920120000_reconciled_curriculum_evidence/migration.sql`.
- The existing configured database remains on its previous 44-competency structure until an explicitly authorized migration and seed plan is reviewed.
- Draft scenes are available only outside production. Production delivery still requires a reviewed exact revision plus independent portfolio approvals.

## Material still requiring people or production operations

- Independent educational, cultural, native-speaker, and accessibility review.
- Professional recordings and consented acoustic evaluation.
- Pilot validation of thresholds and learning claims.
- Reviewed database migration, seed dry-run against an isolated database, backup, and explicit authorization before any shared or production write.
- End-to-end browser verification of the three benchmark packages against an isolated migrated database.
- The three benchmark competencies use the complete branching/evidence path. The remaining 57 competencies have explicit authored canonical scenes and coverage records, but still require the same human review and staged functional expansion before they can be described as production-ready packages.
