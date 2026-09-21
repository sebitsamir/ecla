# Ecla V3 implementation map

This map records the verified frontend boundaries before visual reconstruction. It is descriptive; backend contracts remain authoritative.

## Runtime foundations to preserve

- Clerk: `ClerkProvider`, `useAuthReady`, and authenticated token acquisition.
- Data: `apiClient.ts`, `summary.ts`, account-scoped home caching, scene and lesson endpoints.
- Learner state: course progress, competency mastery, retention review, evidence, missions, and assessment sessions.
- Scene engines: `CanonicalJourney`, `GoldenJourney`, `AssessmentRunner`, voice and audio hooks.
- Platform behavior: PostHog provider, service worker registration, API error boundaries, responsive route loading.

## Presentation layers

1. Foundations: `web/src/design` and `globals.css`.
2. Primitives: `web/src/components/ui`.
3. Product components: `web/src/components/ecla`.
4. Experiences: App Router pages and scene runners.

## Benchmark sequence

1. Foundation and navigation shell.
2. Home using the real learner-home response.
3. Scene Player without changing scene or voice contracts.
4. Learn/Journey using the real course tree and prerequisite states.
5. Visual review at mobile, tablet, laptop, and desktop widths.
6. Propagation to practice, progress, onboarding, missions, secondary screens, cleanup, and performance.

## Current duplication and cleanup candidates

- Legacy hard-coded surface colors remain across product components until each screen is propagated.
- Dashboard presentation is fragmented across equal-priority cards and will be recomposed in Phase 2.
- Scene presentation spans `components/ecla`, `components/scenes`, and `components/golden`; behavior must be traced before consolidation.
- The old global stylesheet contained duplicate animation definitions; Phase 1 consolidated them while retaining compatibility class names.
- Landing and admin surfaces use separate visual patterns. They remain untouched until their assigned phases.
- Static starter SVGs are candidates for cleanup only after repository-wide reference checks.

No file in this list is approved for deletion merely because it is listed as a candidate.
