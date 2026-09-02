# Privacy, security, and accessibility controls

## Data controls and retention

Authenticated learners can request `GET /api/v1/privacy/export`. The export includes profile preferences, attempts and raw text responses, assessment transcripts and decisions, mastery, plans, events, relationships, reviews, and progress. `DELETE /api/v1/privacy/learning-data` requires the exact phrase `DELETE MY LEARNING DATA`; it removes learning records transactionally and resets preferences. The Clerk login identity and email remain so the learner can sign in again, and the response states that boundary.

Temporary voice files are deleted after provider processing succeeds or fails. Raw audio is not persisted by ECLA. Provider processing requires an explicit UI consent check. Rate buckets expire after at most two windows and are removed by the retention job. Derived study-plan snapshots are retained for 90 days and learner events for 365 days. Authoritative attempts, assessment evidence, progress, and account identity remain until the learner deletes learning data or an operator fulfills an account-erasure request.

Educational-pilot participation is opt-in and versioned. Privacy exports include the learner's pilot participation, coded interviews, predictions, and observations. Learning-data deletion removes the participant record and its dependent research observations. Study teams keep recruitment contact details and any re-identification key outside ECLA, and do not place raw interview transcripts or audio in pilot records.

Analytics is disabled unless `NEXT_PUBLIC_ANALYTICS_ENABLED=true` and a key are both present. Do Not Track disables initialization. Autocapture, persistent browser identity, and session recording are disabled.

## Security review

- Clerk middleware protects learner routes; admin and reviewer allowlists are server-side.
- Client-authored evidence, error labels, relationship encounters, and placement remain fail-closed.
- PostgreSQL rate buckets apply atomically across API replicas. Minute limits and daily per-user AI budgets are configurable.
- Provider calls have hard abort timeouts. Platform/provider account spending limits remain required.
- Request IDs accept only UUIDs, preventing log injection. Structured logs omit request bodies and credentials.
- API and web remove framework disclosure and send content, framing, referrer, permissions, transport, and CSP headers.
- CI uses locked installs and rejects high-severity production advisories. The API runtime omits the optional Prisma CLI peer; migrations run in a separate short-lived build-stage container.
- Secrets and environment files are ignored; examples contain placeholders only.

Before public launch, commission an independent penetration test covering Clerk configuration, CORS origins, admin allowlists, provider keys, webhook verification if introduced, dependency supply chain, and cloud database/network policy.

## Accessibility review

The current automated gate includes Next/JSX accessibility lint, strict TypeScript, keyboard-visible focus, a skip link, semantic landmarks, status and alert regions, labeled progress and audio controls, touch targets, reduced-motion behavior, and mobile safe areas. The production build is checked on every change.

Before public launch, manually test the complete signup-to-Gateway journey with keyboard only, VoiceOver/Safari, NVDA/Firefox, 200% and 400% zoom, high contrast, reduced motion, microphone denial, transcription failure, narrow mobile viewports, and captions/transcripts for every recorded asset. Record WCAG 2.2 AA findings and block release on critical failures. Automated lint is not a substitute for assistive-technology testing.
