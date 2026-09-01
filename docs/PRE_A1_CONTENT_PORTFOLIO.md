# Pre-A1 content portfolio

Phase 4 replaces generic coverage claims with an explicit editorial portfolio for all 44 Spanish Pre-A1 competencies. Each entry names its canonical language realization and accepted meaning variants, three distinct situations, two listening deliveries with different speakers/locales and rates, spoken and written production, interaction, repair, transfer, delayed retention, and a cultural note.

The canonical scene seeder compiles the 132 authored situations into immutable scene drafts. It does not publish them. Reusable scene structure is intentional, but the language, setting, partner, opening, learner goal, variation, and learning requirements are explicit for every competency and context.

## Independent review gate

The portfolio records cultural and native-speaker review separately. All new entries begin with `pending` status, a null reviewer, and a plain statement of the review still required. Validation rejects an approval without a reviewer identity, timestamp, and substantive note. Structural validation can pass while publication readiness remains blocked.

An independent reviewer should check:

- natural Spanish and accepted regional alternatives;
- Pre-A1 cognitive and linguistic load;
- whether the situation and learner goal are realistic;
- whether the interaction permits meaning-first success;
- cultural assumptions, privacy, identity, register, and accessibility;
- whether listening variation represents regional speech without treating one accent as the norm;
- whether repair and transfer are materially different from rehearsal.

Reviewers use `/admin/portfolio`. The page displays the exact content hash, all three contexts, language variants, listening deliveries, production, interaction, repair, transfer, retention, and cultural note. A reviewer selects cultural or native-speaker review, records a relevant qualification and substantive note, then approves or rejects. A second independent reviewer handles the other category.

Review decisions are persistent and append-only. Each is tied to the reviewer identity, competency, exact content hash, category, qualification, note, timestamp, and idempotency key. Content edits make previous decisions stale. A rejection supersedes an earlier approval without deleting history. The API prevents the same identity from approving both categories.

Configure each qualified reviewer’s Clerk user ID in the comma-separated `PORTFOLIO_REVIEWER_CLERK_IDS` environment variable on both API and web deployments. This grants access only to the portfolio review page and API. `ADMIN_CLERK_ID` and `ADMIN_CLERK_IDS` users can also review. The two required approvals must come from different configured identities.

Run `npm run validate:portfolio` for static structural coverage. Operational approval progress comes from the database-backed admin page or `GET /api/v1/admin/pre-a1-portfolio`. Every draft embeds the exact portfolio content hash. The canonical publication and learner-delivery services reject a missing portfolio entry, stale content hash, pending or rejected review, or the same identity in both reviewer roles.

## Current boundary

The software/content drafting portion contains 44 competency entries and 132 canonical contexts. A fresh database starts with 88 honest review slots: one cultural and one native-speaker approval for each competency. These cannot be completed by automated tests or by claiming that generated text received human review. The admin progress counter is authoritative for the current content versions.

Reference audio is still marked `tts_fallback`; professionally recorded multi-speaker audio belongs to Phase 6. The Phase 4 listening records specify intended speaker identity, locale, rate, and line so reviewed recordings can replace the fallback without changing the instructional contract.
