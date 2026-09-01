# Phase 2: canonical scene platform

## Delivered

Scenes now have a shared public contract (`ecla.scene/1`), a strict server-side
compiler and content-addressed immutable revisions. The compiler validates task
shape, locale/rate bounds, unique IDs, competency codes, experiment metadata and
known schema versions. Unknown contracts, unknown fields and private evaluator
keys are rejected. Canonical JSON and the compiler version contribute to a SHA-256
version, so key order does not create duplicates and any content or experiment
change creates a new identity.

The database stores author source and compiled delivery together. A trigger makes
both immutable. Review metadata can be added, but changing content requires a new
revision. Publication is a separate pointer and requires review of that exact
revision. Publish uses a caller-supplied expected revision plus a row lock, so a
stale author cannot overwrite another publication. Old revisions remain available
for audit/preview and rollback. Draft, review, publish and unpublish events record
actor, note and time. Database foreign keys prevent removal of referenced history.

The admin page at `/admin/scenes` validates or explicitly migrates source, saves
immutable drafts, previews the exact server document, records an editorial review
note, publishes with stale-write protection, rolls back to an old revision and
shows the audit history. Every endpoint independently enforces the existing admin
identity check. An editorial review record is workflow metadata; it is not a claim
of educator/native-speaker approval or assessment validity.

The generic learner renderer consumes only the server document and validates its
contract at the browser boundary. It provides encounter, choice and typed-response
practice with browser-voice fallback. It never receives evaluator keys, grades
responses, awards XP or writes mastery. Published scene visits are authenticated,
idempotent and record the exact revision plus explicit experiment key/variant.
They also count as prior exposure when the golden assessment decides whether a
context is novel or whether a full retention delay has passed. Preview never
creates learner exposure.

Non-greeting competencies now use the canonical scene catalog. When no revision
has been reviewed and published, the UI says content is unavailable instead of
compiling local content or implying evidence. The Phase 1 greeting assessment
continues to use its verified attempt service, while sharing the new canonical
prompt renderer. Legacy `/scenes` output that exposed raw Scene columns has been
replaced by canonical delivery.

`npm run seed:scenes` converts the three reviewed-needed golden practice sources
into repeatable canonical **drafts**. It intentionally excludes the two reserved
transfer settings and delayed test, and never reviews or publishes anything.
The v0-to-v1 migration maps the explicit `environment` field to `setting`; unknown
versions fail rather than being guessed. Other legacy content requires deliberate
migration as it is authored in Phase 4.

## Database and deployment

Migration `20260831200000_canonical_scene_platform` is additive and was applied to
the isolated `127.0.0.1:55439/ecla_phase1_test` database. The configured application
database was not changed. The older historical clean-install blocker documented
in `GOLDEN_COMPETENCY.md` still must be reconciled before normal deployment.
Do not reset a live database or fake migration history.

After reconciliation: deploy migrations, generate Prisma Client, run
`npm run seed:scenes` against the explicitly selected database, review exact hashes
in the admin workflow, then publish selected revisions. Draft creation alone has no
learner-visible effect. Publication does not enable verified assessment.

## Validation

- API unit/regression tests: 24 passed.
- Isolated PostgreSQL integration tests: 13 passed.
- Web render/regression tests: 7 passed.
- API and web TypeScript checks passed; web lint passed with no warnings.
- Next production build passed and includes `/admin/scenes`.

Tests cover stable hashing, strict contracts, explicit migration, malformed public
responses, private drafts, idempotent concurrent drafting, exact-revision review,
stale concurrent publishers, rollback, immutable source/compiled documents,
admin enforcement, preview isolation, visit replay, experiment snapshots, absence
of XP/mastery writes, and draft-only seeds.

An authenticated visual browser pass was not performed because no test Clerk admin
session was available. Human editorial review, production publication, recorded
audio and educational assessment remain separate work and are not represented by
these automated results.
