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

## Phase 1 software-pilot checkpoint

The golden greeting path now has six versioned server-owned scenes, persistent
resumable attempts, raw-response grading, support tracking, novel-context transfer
and delayed retrieval. PostgreSQL transactions and uniqueness constraints protect
completion, XP and evidence against retries and concurrent requests. The web
journey includes typing, consented recording/transcription, local playback and
explicit provisional-result labels. Shared contracts are bundled from the repo root.

All versions remain educator-review pending. Browser speech is only a fallback;
reference recordings and validated spontaneous spoken interaction are not complete.
The configured application DB has not been migrated or seeded. An older clean-
install migration gap (missing CharacterMemory before the Phase 31 ALTER) remains
a deployment blocker; the additive Phase 1 SQL was tested independently against
the current pre-Phase-1 schema in an isolated PostgreSQL database.

See `docs/GOLDEN_COMPETENCY.md` for setup, evidence semantics, test coverage and
the exact remaining human acceptance work. This checkpoint replaces the missing
attempt/atomic-completion foundation for this competency only; the legacy write
freeze remains in place elsewhere. Phase 1's full educational exit condition is
not yet met, and passing software checks must not be represented as that sign-off.

### Phase 1 validation results

- API unit/regression tests: 20 passed.
- Isolated PostgreSQL integration tests: 8 passed, including independent service
  instances, eight concurrent completions, database rollback and delayed retrieval.
- Web regression/render tests: 5 passed.
- API and web TypeScript checks: passed.
- Web lint: zero errors or warnings; production build passed with the local API URL.
- New additive migration: applied successfully against the pre-Phase-1 schema in
  the disposable database. Full historical clean migrations remain blocked as above.
- Authenticated browser, physical microphone/provider and human learning outcomes:
  not verified; no substitute claim made from unit or integration tests.

## Phase 2 canonical scene platform checkpoint

The scene platform now uses a strict shared `ecla.scene/1` contract compiled on the
server into immutable content-addressed revisions. Admin-only authoring supports
validation, explicit v0 migration, draft creation, exact-version preview/review,
stale-safe publication, unpublication, rollback and audit history. Learners receive
only published public documents through a generic practice-only renderer; visits
record the exact version and optional experiment variant without awarding evidence,
XP or mastery. Three golden practice contexts can be seeded as unpublished drafts.
Reserved transfer and retention contexts are not exposed by that migration.

Phase 2 validation passed 24 API/unit tests, 13 isolated PostgreSQL integration
tests, 7 web tests, both type checks, warning-free lint and a production build. The
configured application database was not changed. The historical migration blocker
from Phase 1 remains, and authenticated admin/browser acceptance was not possible
without a test Clerk admin session. See `docs/CANONICAL_SCENE_PLATFORM.md`.
