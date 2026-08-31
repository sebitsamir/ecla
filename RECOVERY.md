# ECLA recovery — working record

Branch: `codex/ecla-recovery`. Never push or merge without a later user request.
The supplied roadmap is numbered **0–8**, including the integrity freeze.
Existing deletions under `docs/` belong to the user and are excluded from commits.

## Phase 0 — integrity freeze (containment checkpoint; not fully complete)

The legacy evidence, completion, mission evaluation, Gateway completion and
performance endpoints now reject unverified submissions with HTTP 409. There is
no configuration switch to restore these unsafe writes. This is containment,
not a replacement assessment system. Practice remains available without XP,
mastery promotion or graduation. Existing historical mastery is not revalidated
or deleted by this change.

Voice requests use isolated temporary directories, asynchronous writes and
cleanup on success and failure. Voice transcripts are no longer printed to logs.
Browser zoom is allowed. Curriculum JSON is normalized before use; React state
and ref issues are corrected without disabling lint rules.

### Source-of-truth decision

Published, versioned database scenes and server-owned attempts will be the only
assessment source of truth. Local blueprints are practice previews only. They
must never generate persistent mastery evidence. Completion must atomically
claim an attempt, consume server-graded responses and award a reward once.
Legacy assessment writes stay closed until that replacement passes integration
and concurrency tests. No automatic reinterpretation of historical client scores.

### Validation

- API baseline: 11 passing tests; now 15 including real retired-route requests,
  concurrent replay rejection and temporary-audio lifecycle checks.
- API and web TypeScript: passed.
- Web lint baseline: 121 errors, 12 warnings; now zero errors and zero warnings.
- Web regression tests: 3 passed for malformed payloads, stage/target filtering
  and mode selection. `npm test` and `npm run typecheck` are now explicit scripts;
  lint also fails on warnings.
- Database content/curriculum validators: passed against 44 competencies, with
  existing Spanish-marker and missing-vocabulary warnings. No DB writes performed.
- Production build: passed with `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- Public browser preview: rendered successfully; viewport is
  `width=device-width, initial-scale=1`, without zoom restrictions.
- Authenticated browser journey: not tested; preview requires Clerk sign-in.

### Checkpoint limitations and environment

Phase 0 is **not fully complete**: persisted attempts, atomic verified completion,
and their PostgreSQL integration/concurrency tests are still required. The closed
legacy endpoints prevent the known fraud/replay paths but intentionally disable
earned progress until a tested replacement exists. This branch is not ready to
merge as a fully functioning learning product.

The C: drive reached zero free bytes during installation. Only the reproducible
`web/.next/cache` directory was cleared, allowing the test runner installation to
finish. Approximately 159 MB remained at the last check. More disk space is
needed for further dependency, build and database-test work. No personal files,
existing documentation deletions, database records or main-branch commits were
changed. No push or deployment was performed.

## Remaining phases

1. Golden competency `PA1.SOC.GRT.01`: persisted attempts, verified grading,
   three contexts, transfer and delayed retrieval; recordings and educator review.
2. Versioned scene platform: shared validated contracts, server compilation,
   seeds, preview/publication and content migrations.
3. Credible assessment: persisted mission/Gateway sessions, readiness checks,
   objective rubrics, evaluator audit/versioning and acoustic-provider boundaries.
4. Full Pre-A1: authored coverage of all 44 competencies and real educator/native
   speaker review. Generated drafts do not satisfy human review.
5. Adaptation: recent weighted evidence, placement, SRS, error repair,
   interleaving, support fading and explainable study plans.
6. Product experience: audio/art, mobile ergonomics, continuity, resumable
   attempts and offline practice without offline mastery claims.
7. Production: CI, integration/E2E/concurrency tests, operations, distributed
   quotas, timeouts, privacy/data controls, accessibility and dependency remediation.
8. Educational proof: 20–30 beginners over 6–8 weeks, interviews, external
   speaking/retention evaluation and calibration. Requires actual participants;
   cannot be completed or represented as validated by generated code or documents.

Each phase receives a separate commit only with an explicit validation/status
record. A partial implementation must never be described as educationally proven
or production-ready. Human review, recording production and the pilot remain
external work; their absence must not be hidden behind passing software tests.
