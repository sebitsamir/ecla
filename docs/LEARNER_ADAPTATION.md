# Learner adaptation contract

Phase 5 introduces an automatic study plan at `GET /api/v1/adaptation/plan`. The response uses the versioned `ecla.adaptation/1` contract and is also included in `GET /api/v1/learner/home`. Every plan records its evidence hash, generation time, expiry time, placement explanation, confidence calibration, repair priorities, and up to five ranked actions.

## Evidence boundary

The planner reads completed `LearningAttempt` and `AttemptResponse` records produced by the server-owned attempt system. It does not accept client scores, client error labels, context claims, or mastery decisions. The legacy `/api/v1/learner/error` endpoint is fail-closed. Confidence is a separate self-report event and never updates assessment confidence or mastery.

Educator review remains visible in weighting. A response from an unreviewed scene receives only 35% of the weight of reviewed evidence, and supported responses receive 45% of independent-response weight. Evidence loses half its weight every 30 days. Placement and prerequisite progression use reviewed mastery or repeated independent server evidence; old unreviewed mastery rows cannot silently unlock the curriculum.

## Planning behavior

The error taxonomy is derived from the response dimension: comprehension, retrieval, production, interaction, transfer, and retention. A failed attempt without a successful repair also creates a repair-gap signal. The strongest recent signals produce a short repair plan with a concrete strategy.

Competency review priority combines due dates, recency-weighted accuracy, error frequency, context novelty, and curriculum prerequisites. Recently attempted competencies receive a penalty so adjacent actions interleave skills. Support fades only after repeated independent success. Controlled abilities with fewer than three observed contexts receive a novel-context transfer action before the planner treats them as generalized.

Placement is deliberately conservative: no authoritative evidence means `unplaced`; a small amount means `foundation`; broader evidence means `developing`; and only broad, reviewed functional evidence can produce `functional`. This is an internal Pre-A1 starting band, not a CEFR certificate or Gateway result.

Plans are append-only snapshots in `LearnerPlanSnapshot`. A database trigger rejects updates, and the evidence hash includes a 15-minute time bucket so recency and due-review changes create a new snapshot instead of rewriting history. Identical requests within a bucket replay the same plan.

## Current limits

The planner can only adapt across competencies with server-owned attempt evidence. The current golden attempt journey supplies authoritative evidence for its covered competency; other curriculum areas remain recommendations until their canonical assessment scenes are available and reviewed. The planner does not fabricate missing evidence, approve content, award mastery, or bypass the Gateway.
