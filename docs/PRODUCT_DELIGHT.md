# Product delight boundaries

Phase 6 makes the current learning paths clearer and more pleasant without weakening the evidence rules established in earlier phases.

## Scene experience

Canonical and golden scenes use a shared responsive world header. Setting keywords select a stable visual mood, while the server-provided speaker name supplies the character identity. These visuals are presentational only: they do not select curriculum, grade responses, or establish context novelty.

Spoken lines use one deterministic browser voice selection path and the authored locale and speed. Every model button identifies this as a browser fallback. Recorded and professionally reviewed reference audio is still pending, so the product does not describe browser synthesis as studio or native-speaker audio and does not award pronunciation evidence from it.

Published practice renders as soon as its validated scene contract arrives. Idempotent practice-visit telemetry runs afterward and cannot delay the first interactive turn. Server-graded attempt turns still wait for the authoritative response before advancing.

## Mobile and motion

Signed-in pages provide a thumb-reachable bottom navigation on small screens, safe-area padding, a keyboard skip link, visible focus states, and reduced-motion behavior. Character motion is subtle and automatically disabled by the existing `prefers-reduced-motion` rule.

## Continuity and resume

Golden attempts already resume from persistent server state. The learner now sees an explicit resume notice with the saved task number. Completing an attempt records the named server-authored speaker in `CharacterMemory` in the same transaction. Replaying an already completed request does not add another encounter. The legacy client encounter endpoint is fail-closed, so clients cannot fabricate relationships.

## Offline behavior

The service worker caches only the offline shell and same-origin static assets. It explicitly excludes API and authentication paths. Published canonical scene contracts and their small catalogs are cached separately in browser storage after runtime validation. They contain authored public content, not learner data.

When offline, a cached canonical scene is clearly labeled practice-only. It does not record a visit, evaluate a response, award XP, update mastery, or queue a later evidence write. Assessments, plans, progress, and relationship data always require the server.

## Onboarding and progress

Onboarding no longer uses a client-scored multiple-choice quiz to claim a CEFR placement. It collects preferences, starts at the Pre-A1 boundary, and explains that placement and support changes follow completed server-scored situations. The dashboard links to the Phase 5 plan, where every recommendation exposes its evidence and reason.
