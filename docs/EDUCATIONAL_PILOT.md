# Phase 8: educational proof protocol

Phase 8 is ready to run, but it is not complete until a real cohort finishes the study. ECLA must never seed, simulate, or backfill participant outcomes to clear the report blockers.

## Preregistered design

- Recruit 20–30 adults independently screened as true Spanish beginners.
- Run one locked protocol for 6–8 weeks. Record protocol, consent, curriculum, rubric, and mastery-model versions before starting.
- Obtain explicit consent before research observations. Participation is voluntary and learners can withdraw through `POST /api/v1/pilots/:slug/withdraw`.
- Arrange any institutional, ethics, safeguarding, or legal review required for the study location before recruitment.
- Use participant codes in research exports. Keep recruitment contact details outside ECLA and restrict the re-identification key to the study lead.
- Do not store raw interview transcripts or audio in pilot tables. Store coded themes, redacted summaries, and access-controlled evidence references.

## Measurement schedule

| Time | Required evidence |
| --- | --- |
| Before week 1 | Independent beginner screen and baseline external speaking assessment |
| Every week | Structured interview, usage/adherence check, and scheduled retention task |
| Week 6–8 | External post-assessment by an assessor who did not teach the learner |
| Final session | At least five unfamiliar Ultimate Test situations per participant |
| Delayed follow-up | Retention assessment after the protocol-defined delay |

External speaking and Ultimate Test outcomes require a server-frozen ECLA prediction. Create it before revealing the task to the assessor. The server calculates it from authoritative mastery records and stores its evidence cutoff; the assessor cannot edit it.

Observed performance uses a preregistered 0–1 rubric. Assessors must be trained, blinded to ECLA's prediction, and identified in the audit record. A second assessor should double-score the preregistered calibration sample. Disagreements remain in source evidence and are resolved under the protocol, never by editing predictions.

## Ultimate Test situations

Use unfamiliar speakers and contexts for at least five of these seven functions: greeting and introduction, buying a requested item, understanding simple directions, requesting an item or service, repairing a misunderstanding, answering a simple personal question, and closing an exchange appropriately. Each task version defines objective achievement, comprehension, independence, repair, intelligibility, and scoring anchors.

## Weekly interview instrument

Ask the same core questions each week: what the learner attempted outside ECLA, where support was needed, what felt misleadingly easy or hard, whether the next-action explanation made sense, and whether any content felt culturally inappropriate. Store predefined codes and a redacted summary. Positive sentiment is not ability evidence.

## Analysis and revision gate

`GET /api/v1/admin/pilots/:slug/report` reports enrollment, completeness, mean absolute prediction error, average prediction and observation, overprediction, and agreement at the preregistered 0.70 threshold. It names every missing evidence condition. Calibration rows contain participant-free task comparisons.

Before changing curriculum or scoring, record the decision and affected versions through `POST /api/v1/admin/pilots/:slug/revisions`. Preserve the original protocol and measurements. A follow-up study uses a new protocol/model version so improvements are not evaluated on the data used to design them.

The educational-proof claim may be approved only after all automated blockers clear and the preregistered success criteria, assessor agreement threshold, attrition rule, and adverse-event review pass. Clearing blockers establishes data completeness; it does not by itself prove effectiveness.

## API order

1. Admin creates the study and invites independently screened users.
2. Each learner reviews the exact consent version and submits `I CONSENT TO THE ECLA PILOT`.
3. Admin starts the cohort only when 20–30 learners have consented.
4. Before each external or Ultimate Test task, admin locks an ECLA prediction.
5. The independent assessor records the matching observation using that prediction ID.
6. Interviewers record weekly coded interviews with idempotency keys.
7. Admin reads the report and records every scoring or curriculum revision decision.
8. After the full duration, admin calls `POST /api/v1/admin/pilots/:slug/complete`; the API refuses while any completeness blocker remains.

All write endpoints require Clerk authentication. Study creation, screening attestation, predictions, measurements, interviews, reports, and revisions require configured API administrators. Learners can only consent to or withdraw their own invitation.
