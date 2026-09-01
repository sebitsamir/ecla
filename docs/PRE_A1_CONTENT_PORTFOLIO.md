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

The reviewer must edit the relevant review record with their identity, ISO timestamp, and decision note. A second independent reviewer handles the other review category. Re-run `npm run validate:portfolio`; the output reports structural coverage and outstanding approvals. Every draft embeds the exact portfolio content hash. The canonical publication service rejects a missing portfolio entry, stale content hash, pending review, or the same identity in both reviewer roles.

## Current boundary

The software/content drafting portion contains 44 competency entries and 132 canonical contexts. There are currently 88 honest review blockers: one cultural and one native-speaker approval for each competency. These cannot be completed by automated tests or by claiming that generated text received human review. Until qualified reviewers complete them, the portfolio is a complete authored draft rather than a publication-ready course.

Reference audio is still marked `tts_fallback`; professionally recorded multi-speaker audio belongs to Phase 6. The Phase 4 listening records specify intended speaker identity, locale, rate, and line so reviewed recordings can replace the fallback without changing the instructional contract.
