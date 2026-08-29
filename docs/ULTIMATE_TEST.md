# Ultimate Test Checklist (Phase 48)

After completing Pre-A1 in ECLA, remove the app. Give the learner real situations:

- [ ] Meet a Spanish speaker and introduce yourself
- [ ] Ask for water or a simple item
- [ ] Buy something (price + payment)
- [ ] Ask where something is
- [ ] Ask someone to repeat or slow down
- [ ] Recover from a deliberate misunderstanding
- [ ] Handle one unfamiliar situation without help

## Pass condition
Meaning communicated in at least 5/7 situations without English fallback.

## Fail condition
If they cannot: dashboard, XP, and animations do not matter. Return to curriculum and evidence integrity (Phases 1–4).

## Automated pre-check (CI)
```bash
cd api && npm run test && npm run validate:content && npm run validate:curriculum
```
