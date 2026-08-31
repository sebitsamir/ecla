# Phase 1: golden greeting software pilot

## Status

The software pilot for PA1.SOC.GRT.01 is implemented. Full educational sign-off
is not complete: reference recordings, educator/native-speaker review, validated
spontaneous spoken interaction and authenticated browser/microphone acceptance
remain outstanding. Do not merge this as a proven language-learning product.

Three practice contexts cover a Madrid neighbor in the morning, a Bogotá café in
the afternoon and a Mexico City evening class. Named speakers, recognition,
retrieval, production and scripted repair exchanges lead to two reserved transfer
settings and a separate delayed-retrieval scene. Browser speech is explicitly a
fallback, not recorded reference audio. Scripted replies are not proof of real
conversation skills. All learning modes for this competency enter the same pilot.

## Server-owned evidence

The API owns content versions, immutable attempt snapshots, task order, answer
keys, support use, novelty, grading, review eligibility and XP. Clients send only
raw actions and request UUIDs; extra score/context/review fields are rejected.
Every attempt endpoint authenticates and checks learner ownership. Public steps
omit answer keys and unrequested support models.

PostgreSQL learner-row locks serialize writes across API processes. Unique indexes
allow one active attempt per competency, one response per sequence and idempotent
request keys. Completion atomically saves results, mastery, progress, XP and streak
records. Replays return the saved result. Only the first independent success earns
10 XP for the shared STORY experience. Repeated scenes do not farm additional XP.
Completions preserve lock order even within the same clock millisecond. Attempts
expire after two hours; up to 50 starts per learner per day are allowed.

The deterministic evaluator accepts explicit variants with case/accent/punctuation
normalization. It can reject other valid paraphrases. Typed and learner-confirmed
transcribed answers both supply text-mediated evidence, not pronunciation,
acoustic intelligibility or spontaneous speech scores. Provider calls never run
inside assessment transactions. Legacy assessment write routes remain frozen.

Unobserved dimensions are null. Correct independent answers contribute 100,
correct supported answers 50, and failures 0. Subsequent observations weight
previous evidence 60% and current evidence 40%. These are uncalibrated pilot
estimates, not probabilities. Three passed practice contexts and repair evidence
are required before transfer. Only the first attempt at a setting is novel; replay
cannot restore transfer after a failure. The finite context pool may need more
reviewed content. Retention requires successful transfer and 24 hours after both
the last completion and last start. Expired unfinished practice postpones it too.
Elapsed time merely opens the check; successful responses supply evidence. A later
failure lowers the previous high-stage claim.

All seeded versions have educatorReviewed=false. Provisional stages are displayed
separately; recorded mastery stays DEVELOPING and reviewed dimensions stay null.
Never flip this flag to simulate actual review. Approvals must refer to the exact
version. New content creates a new version; old attempts retain their snapshots.

Recording requires consent, stops after 60 seconds, supports local playback and
releases microphone tracks. Transcription failure leaves typing available. The
voice route cleans temporary server audio; this is not a promise about provider
retention. No provider speech-quality claim is made.

## Installation and migration warning

The configured application database was not changed. Tests used a separate native
PostgreSQL 18 cluster on 127.0.0.1:55439, database ecla_phase1_test. Its files and
throwaway credentials are ignored under .local-test. Integration tests refuse
other hosts, ports or database names and do not fall back to DATABASE_URL.

A fresh prisma migrate deploy fails in the older migration
20260829180000_phase31_learner_extensions: it alters CharacterMemory without an
earlier migration creating that table. Reconcile this historical gap against the
deployment history before deployment. Do not reset a live database or mark missing
migrations applied to hide the failure.

The new additive migration 20260831140000_golden_attempts was successfully tested
against the schema from pre-Phase-1 commit f50271e in the disposable database. The
baseline was created there with Prisma db push, then the new migration SQL was
executed. This validates the new migration, not the broken historical chain.

For an existing installation: back up, verify schema/history against the prior
application schema, reconcile migration drift, then deploy the additive migration
through the normal workflow. Generate Prisma Client and run npm run seed:golden
from api against the explicitly selected database. Core curriculum and a STORY
experience for the competency must already exist. The idempotent seed creates six
pending-review versions and never runs on server startup. The learning UI explains
missing scene installation rather than substituting invented local assessments.

## Verification

From api: npm test; npm run typecheck; npm run test:integration.
The last command requires TEST_DATABASE_URL with your credentials pointing only
to the isolated test DB above. It creates unique test learners and removes those
learners afterward. It seeds the six scenes idempotently. Test HTTP authentication
is injected into a test-only router; production authentication is not bypassed.
No Clerk or transcription-provider calls occur in the suite.

From web: npm test; npm run lint; npm run typecheck; npm run build.
Set NEXT_PUBLIC_API_URL to the intended API before building. The shared public
contract lives in packages/contracts/golden.ts; evaluation keys stay on the API.

Coverage includes HTTP rejection/ownership, concurrent starts, response replay and
sequence rejection, eight simultaneous completions across service instances,
late transaction rollback, assistance, resume/expiry, transfer order, delayed
retrieval, failed-first/later-success XP and consumed novelty. Unit tests cover
schema validity, private-field filtering, grading, forged scores, evidence decline
and honest rendering of provisional/unmeasured results. Automated service and
render tests do not substitute for authenticated browser and microphone testing.

## Remaining acceptance work

- Educator/native-speaker review of every scene, accepted answer, support model and
  cultural note; record reviewer, date and exact content version hash.
- Consented reference recordings of model lines in api/src/golden/curriculum.ts,
  with slow/natural takes and intended regional variation. Validate transcript
  alignment, intelligibility and licensing, then add versioned audio assets.
- Authenticated desktop/mobile checks: keyboard access, resume after refresh,
  network failure/retry, microphone denial, playback, failed transcription,
  editable transcript, concurrent tabs and a delayed return.
- Actual beginner spoken-performance evaluation in unfamiliar interactions before
  claiming retained transfer or spoken fluency.

This is a software-pilot checkpoint, not full Phase 1 educational sign-off.
