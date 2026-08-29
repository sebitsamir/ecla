# ECLA API Contract (Phase 39)

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <Clerk JWT>` on all learner routes.

## Course

### `GET /course/map`
- **Response:** `{ courses: [{ level, title, units: [{ competencies: [{ id, code, canDo, status, patterns, evidence }] }] }] }`
- **Status values:** `mastered` (TRANSFERRED/RETAINED), `developing`, `upcoming`, `locked`
- **Side effects:** none

## Learner

### `GET /learner/summary`
- **Response:** `{ summary: { name, demonstrated, total, week, dimensions, dueReviews, nextAction, units } }`
- **Side effects:** none

### `GET /learner/competencies`
- **Response:** dimensional evidence per competency + summary stats

### `POST /learner/demonstrate`
- **Body:** `{ competencyId, evidence, contextId?, review? }`
- **Side effects:** updates CompetencyMastery with strict ladder promotion

### `POST /learner/confidence`
- **Body:** `{ competencyId, level: 1-4 }`
- **Side effects:** stores confidence (does not affect mastery)

### `POST /learner/error`
- **Body:** `{ competencyId?, expected?, response?, stage? }`
- **Side effects:** classifies and stores error event

### `POST /learner/performance`
- **Body:** `{ competencyId, correct, total, supportUsed?, responseTimeMs? }`
- **Side effects:** merges performance snapshot

### `GET /learner/chat-context`
- **Response:** curriculum-bound context for AI teacher

## Adaptive

### `GET /adaptive/next`
- **Response:** `{ dimensions, next: { kind, href, reason, mode } }`

### `GET /adaptive/review`
- **Response:** `{ due: [{ id, code, canDo }] }`

## Lessons

### `GET /lessons/:competencyId`
- **Response:** compiled lesson payload for scene engine

### `POST /lessons/complete`
- **Body:** completion + dimensional evidence

### `POST /lessons/grade`
- **Body:** `{ answer, expected, accept? }` → functional meaning judge

## Missions & Gateway

### `GET /missions` / `POST /missions/:id/attempt`
### `GET /gateway` / `POST /gateway/complete`

## World & Transfer

### `GET /world/environments`
### `GET /transfer/next`

## Errors

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Rate limited (AI/voice) |
| 500 | Server error |

All errors: `{ error: string, retryAfterMs?: number }`
