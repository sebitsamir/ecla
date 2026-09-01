# Assessment credibility boundary

Phase 3 replaces client-authored Mission and Gateway evidence with persistent, server-owned assessment sessions. A learner can submit only an idempotency key, raw typed text, or a confirmed speech transcript. Scenario order, partner turns, eligibility, rubric versions, evaluation results, review decisions, and the final Gateway decision are owned by the API and recorded in an append-only audit trail.

## Promotion rules

- Mission and Gateway assessments require educator-reviewed `CONTROLLED` mastery with confidence of at least 70 for every relevant competency.
- The Gateway uses seven server-shuffled functional situations. Passing requires human approval in at least five situations and average human-review confidence of at least 0.75.
- Text matching is reported as functional text evidence. It is never described as pronunciation or intelligibility.
- Approval requires a reviewed acoustic observation tied to the same session and scenario, with explicit consent attestation. Raw audio is not stored by this model.
- Assessment code does not award XP, modify mastery, or promote a learner automatically. Final decisions are immutable.

## Rubrics and evidence

Rubrics are immutable, content-addressed definitions. Review requires an attested calibration set of at least 20 samples and agreement of at least 0.75. The evaluator stores its version, confidence, matched criteria, and evidence scope with every scenario result. Database triggers prevent mutation of observed turns, acoustic observations, evaluator results, audit facts, eligibility snapshots, and completed decisions. Human-review fields remain editable only until finalization and use an expected-decision check to reject stale updates.

Partner generation receives only the server-owned history and objective. Provider failure does not silently substitute a random response: the learner turn remains saved and the same request can be retried safely. Concurrent retries produce one stored partner reply, although an external provider may be invoked more than once. Distributed provider-call deduplication and cost controls remain operational work for Phase 7.

## Production readiness boundary

The repository now contains the assessment architecture and isolated integration coverage. It does not contain real calibration results, a production acoustic-analysis provider, or completed human reviews. Test rubrics and acoustic references are fixtures only and are never seeded into production. Until educators supply reviewed rubrics and an approved acoustic review workflow, production Mission and Gateway starts remain unavailable rather than inventing evidence.

The isolated test database is `127.0.0.1:55439/ecla_phase1_test`; assessment integration tests refuse any other target. The configured application database is not used by these tests. A clean migration from the oldest repository history still encounters the pre-existing Phase 31 `CharacterMemory` ordering gap, which is outside this phase and must be repaired before treating the entire historical migration chain as deployable.

## Interfaces

Learner routes create Mission or Gateway sessions, read a session, append a turn, evaluate the current server-owned scenario, and finalize a reviewed Gateway. Administrator routes create and review rubric versions, inspect full sessions and audit history, attach reviewed acoustic observations, and record human decisions. Legacy Mission evaluation and Gateway completion routes remain frozen because they accept client-authored evidence.
