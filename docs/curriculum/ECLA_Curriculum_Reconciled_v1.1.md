# ECLA — Reconciled Curriculum Specification v1.1

Date: 15 September 2026

Scope: universal curriculum rules and the Spanish Pre-A1 release baseline
Status: reconciled authoring specification; implementation and independent educational validation pending

## 1. Authority and purpose

ECLA develops demonstrated communication: understanding, expressing meaning, interacting, repairing misunderstandings, transferring ability, and retaining it. Completion, XP, vocabulary counts, and recognition scores are not proficiency.

This document resolves conflicting proposals in `Ecla(1).md` and `eclav2.md`. It supersedes their conflicting definitions for future authoring. It does not modify the uploaded originals, the database, application behavior, published content, or learner evidence. “Reconciled” means a consistent design baseline, not a claim of proven learning effectiveness or CEFR certification.

Authority order:

1. Educational constitution: communication, intelligibility, meaningful context, humane support, evidence, and language accuracy.
2. This versioned curriculum specification and its canonical registry.
3. Reviewed language realizations and task specifications.
4. Reviewed content, media, assessment definitions, and implementation contracts.
5. Application implementation.

The repository's existing IDs are retained as migration anchors. Their existing meanings are not automatically educationally ideal; retained IDs avoid reassigning old evidence to a different ability. New abilities receive new IDs. Future semantic changes require an explicit version and migration decision.

Source baseline: uploaded `eclav2.md` (597 lines); uploaded `Ecla(1).md` (15,706 lines); repository structure seed and portfolio at local commit `833fdd6`. Relevant source sections are listed in §14. The 44-entry portfolio is not the definition of curriculum completeness.

## 2. Decisions that resolve the conflicting drafts

| Conflict | Reconciled decision |
| --- | --- |
| Different meanings assigned to one competency ID | Preserve the structure-seed meaning; relocate conflicting draft content through §5. Never rewrite existing evidence by an unqualified string replacement. |
| 44 competencies treated as complete coverage | Adopt the 44 retained IDs plus 16 explicit additions below: 60 curriculum records. This is an ECLA design decision, not an official CEFR count. |
| Five phases, thirteen phases, nine units, and several stage sequences | Nine navigation units organize content. Dependencies and learner evidence govern progression. Earlier phase names are historical planning views, not competing runtime stages. |
| Eleven-step lesson loop versus nine-stage sequence | Use nine pedagogical stages across a learning sequence; assessment observes stages rather than becoming a tenth task. See §7. |
| “Five states” numbered 0–5 | Six stored mastery states, explicitly defined in §8. |
| Ten-point score and decimal CEFR labels | Retire them as authoritative proficiency outputs. Preserve evidence by dimension; do not present B1.7 as an official CEFR level. |
| Free Pre-A1 performance interpreted as no support | Independence means selecting language without an answer model. Slow speech, gestures, replay, and cooperative clarification may still be allowed and recorded. |
| Every competency gets five identical modes | Modes are delivery options, not five copies of a curriculum. Provide a mode only when it serves a real learning need. |
| “Different price = transfer” | Changing a number is controlled variation unless the task also requires independent interpretation in an unpractised context. |
| Fixed review schedule versus adaptation | Use the schedule as a starting policy; observed difficulty and delay determine the next intervention. Time alone earns no evidence. |
| “Post-C2” professional specialization | Domain specialization is a parallel track at suitable entry levels, not a mandatory level beyond C2. Professional competence requires its own domain review. |
| “Me... from Juba” accepted as Spanish graduation evidence | Record communicative success separately from target-language production. English-only output cannot establish Spanish production. |
| Wrong stress model | Correct `gra-CIAS` to `GRA-cias`. Other pronunciation examples still require audio and language review. |
| “Foundation locked” despite open assessment rules | Freeze this version for authoring, but label thresholds and educational claims as pilot policies until validated. |

## 3. Pre-A1 boundary and learner conditions

The learner begins participating in short, familiar, purposeful exchanges using words and formulaic expressions. A cooperative partner can speak slowly, repeat, gesture, or rephrase. The learner can request help and clarification. Accurate complex sentences, native-like pronunciation, unrestricted conversation, and unfamiliar multi-step navigation are not required for the core Pre-A1 claim.

Every task must distinguish:

| Field | Required definition |
| --- | --- |
| Known language | Explicit prerequisite chunks, meanings, and functions; not just “beginner vocabulary.” |
| New productive language | The particular words or chunks the learner will be expected to retrieve or construct. |
| Supported receptive language | Material the partner may say with an explanation, visual, or repeat; not automatically required in learner output. |
| Incidental language | Non-essential language whose interpretation is not scored. |
| Allowed assistance | Replay, captions, visual reference, translation, first-word cue, model, and partner rephrasing, each recorded separately. |
| Practical outcome | What changes because the learner communicates: the correct item is selected, identity clarified, or relevant information obtained. |
| Scope exclusions | Untaught grammar, numbers, vocabulary, or listening conditions that must not determine success. |

Initial authoring default: introduce at most three new productive chunks in a short learning sequence and isolate one principal new form/function contrast. This is a workload policy for piloting, not a universal scientific threshold. High-support exposure may contain additional receptive language, explicitly glossed. Increase load only after learner evidence supports it.

Spanish scope:

- Productive foundations: greetings, courtesy, personal details, familiar nouns and articles, one-feature description, needs/wants, requests, acceptance/refusal, negation, basic questions, basic possession, simple location, numbers 0–20, common time words, whole-hour chunks, and a small set of routine/action chunks.
- Learn verbs through useful forms and expressions. Listing a verb does not require its complete present-tense paradigm. Treat `¿Me das...?`, `¿Puede ayudarme?`, and similar expressions as supported chunks before grammatical analysis.
- Receptive extensions: common service openings, a limited formal-address alternative, and carefully supported partner variations. A new regional expression is not automatically an independent listening requirement.
- Exclude from core requirements: subjunctive, tense-system mastery, extended narration, complex object-pronoun manipulation, multi-clause argument, rapid noisy multi-speaker listening, or long unscripted transactions.
- Whole hours and short routes can be practised as extensions; do not use them to silently redefine basic time-word or location competencies.
- Start greetings and usable repair language immediately. The learner need not master vowels, reading, or grammar before initiating supported communication.
- Fictional names, ages, cities, and roles are valid. Exact addresses and real personal disclosures are unnecessary.

The Council of Europe's Companion Volume supports slow, clear, repeated and visually supported Pre-A1 comprehension and formulaic interaction. It is a reference framework, not ECLA's syllabus or an endorsement of this registry. See §13 for the mapping boundary.

## 4. Canonical Pre-A1 registry

IDs remain language-independent even when examples below are Spanish. Skill facets distinguish listening, production, interaction, reading, writing, pronunciation and pragmatics without multiplying every social function into several unrelated IDs. A single activity may supply several facets, but one facet cannot substitute for another.

“Retained” means the ID already exists in the structure seed, not that its content is complete or valid. “New” means specified here and not yet seeded.

### 4.1 Retained IDs: 44

| ID | Canonical ability | Required content/evidence focus |
| --- | --- | --- |
| PA1.SND.LST.01 | Distinguish familiar sound contrasts in words | Hear supported familiar words; identify the relevant contrast without requiring phonetic terminology. |
| PA1.SND.LST.02 | Follow common learning instructions | Perform the requested action; distinguish listening, looking, repeating, and reading. |
| PA1.SOC.GRT.01 | Recognize and use basic greetings | Recognize, respond, and initiate; record these separately. |
| PA1.SOC.GRT.02 | Close a simple interaction | Choose an appropriate farewell from the established situation. |
| PA1.SOC.COU.01 | Use basic courtesy | Request marker, thanks, apology, attention-getting; distinguish their functions. |
| PA1.SOC.INT.01 | Give a name in interaction | Respond to an introduction or name request; real or fictional details. |
| PA1.SOC.INT.02 | Ask another person's name | Initiate the question and use the answer. |
| PA1.SOC.GRT.03 | Ask how a familiar person is | Ask a wellbeing question rather than a name or age question. |
| PA1.SOC.GRT.04 | Respond about current state | Give a chosen state; no forced positivity. |
| PA1.SOC.RES.01 | Acknowledge a first introduction | Respond to meeting someone; reciprocal forms and register. |
| PA1.PER.NAM.01 | State or confirm identity | Identity-check and correction context; distinguish from the first introduction. |
| PA1.PER.ORG.01 | State origin | Origin is separate from residence, citizenship, and current travel departure. |
| PA1.PER.LOC.01 | State current residence | Broad area or fictional city; no address disclosure. |
| PA1.PER.LNG.01 | State language ability | Positive, negative, and limited ability chunks. |
| PA1.PER.AGE.01 | State an age | Use a supported number and age chunk; role details may be fictional. |
| PA1.PER.IDN.01 | Combine a short personal profile | Name, origin, residence, and language; not merely “I am a student.” |
| PA1.WLD.NAM.01 | Identify familiar people and relationships | Family/social vocabulary in a fictional photo or social context. |
| PA1.WLD.OBJ.01 | Identify familiar objects | Name an object, using supported noun/article chunks. |
| PA1.WLD.COL.01 | Identify or specify color | Select/correct a color; include accessible labelled alternatives. |
| PA1.WLD.DES.01 | Describe a person or object with one feature | Familiar adjective, clear referent, meaning-first correction. |
| PA1.NED.WNT.01 | Express an immediate want | Distinguish wanting an item now from generally liking it. |
| PA1.NED.NED.01 | Express a basic need | Concrete need or help; no required diagnostic language. |
| PA1.NED.LIK.01 | Express a basic preference | Positive/negative singular or chunked activity preference; no automatic demand for plural paradigms. |
| PA1.NED.FOD.01 | Request familiar food or drink | An item request can succeed without an infinitive construction. |
| PA1.NED.REQ.01 | Make a polite request | Request and clarify a concrete item using an appropriate supported form. |
| PA1.SRV.NUM.01 | Use simple everyday numbers | Explicit subprogression: 0–10, 11–20, mixed listening, quantities, and short digit strings. |
| PA1.SRV.TIM.01 | Understand basic time references | Today, tomorrow, now and familiar parts of day; not clock-time grammar. |
| PA1.SRV.LOC.01 | Ask where a familiar place/object is | Produce the location question and identify the requested referent. |
| PA1.SRV.LOC.02 | Understand simple location answers | Here, there, near, far and familiar supported location chunks. |
| PA1.SRV.PAY.01 | Handle a simple purchase | Price inquiry, amount comprehension, confirmation, and acceptance/decline; price alone is partial coverage. |
| PA1.INT.UND.01 | Signal non-understanding | Distinguish lack of understanding from refusal. |
| PA1.INT.REP.01 | Request repetition | Missed sound/message, repeated response, then use of information. |
| PA1.INT.SLW.01 | Request slower speech | Speed-related breakdown; record whether the new delivery helps. |
| PA1.INT.QUE.01 | Ask what a word means | Unknown meaning; not a generic set of question words. |
| PA1.INT.CON.01 | Confirm simple information | Accept, reject, or correct the specific proposition after understanding it. |
| PA1.RL.INT.01 | Complete a reciprocal introduction | Combine greeting, identity question/answer, chosen detail, and closure. |
| PA1.RL.CAF.01 | Complete a short café exchange | Request, one clarification/change, amount if relevant, and polite closure. |
| PA1.RL.DIR.01 | Ask for and use a simple location response | Immediate familiar location; bounded cooperative repair. |
| PA1.RL.HEL.01 | Request basic help | Get attention, state a known need/detail, use the offered help. |
| PA1.RL.SOC.01 | Sustain a brief social exchange | Respond contingently and take turns; not recite both sides. |
| PA1.GAT.SUR.01 | Demonstrate a basic survival interaction | Independent choice of known language for a bounded need or transaction. |
| PA1.GAT.INT.01 | Demonstrate conversation repair | Select an appropriate repair and use the clarified information. |
| PA1.GAT.PRO.01 | Demonstrate a personal profile | Spoken and written familiar facts; PRO means profile, not purchase or professional mode. |
| PA1.GAT.MIS.01 | Demonstrate an integrated practical mission | Combine known abilities around a held-out but accessible goal. |

### 4.2 Explicit additions: 16

These fill missing objectives without changing existing meanings. Each requires new content, review and implementation before it can count toward coverage.

| ID | Canonical ability | Boundary and demonstration |
| --- | --- | --- |
| PA1.SND.PRD.01 | Produce familiar words intelligibly | Record a familiar word/chunk in context; evaluate actual audio, not transcription confidence. |
| PA1.SND.WRD.01 | Hear familiar word boundaries and stress | Locate a familiar chunk in short supported speech; include reviewed stress models. |
| PA1.RDG.DEC.01 | Connect familiar written and spoken forms | Read/recognize familiar words and digits; support different literacy starting points. |
| PA1.RDG.SGN.01 | Interpret familiar signs and labels | Choose an action from an illustrated familiar sign, label, or menu item. |
| PA1.WRT.INF.01 | Enter simple personal information | Fill a short form from fictional role details; copying and independent writing are separate evidence. |
| PA1.WRT.MSG.01 | Produce a very short practical message | Greeting, chosen detail, basic request or time/place chunk; no paragraph requirement. |
| PA1.WLD.POS.01 | Express basic possession | “Es mi libro”; ask/confirm “¿Es tu libro?” with supplied objects. |
| PA1.WLD.EXT.01 | State presence or absence | “Hay agua / No hay agua”; do not confuse presence with object naming or location. |
| PA1.PER.ROL.01 | State a chosen role | “Soy estudiante”; selected role rather than compulsory employment disclosure. |
| PA1.ACT.RTN.01 | State a familiar action/routine | One or two reviewed chunks such as “Estudio” or “Trabajo aquí”; no routine narrative. |
| PA1.NED.ABL.01 | Express basic ability/inability | “Puedo / No puedo” and one taught complement; no full modal system. |
| PA1.NED.RES.01 | Accept or refuse an offer | Respond according to the role goal; a polite refusal can be successful. |
| PA1.INT.QST.01 | Ask for a missing detail | Choose a taught what/who/where/when/how-much question appropriate to the gap. |
| PA1.INT.WRD.01 | Ask how to express an unknown word | “¿Cómo se dice...?” with supplied source-language or visual referent; also practise “No sé” and requesting a moment. |
| PA1.SRV.CLK.01 | Ask, understand, or state a supported whole hour | Separate current time from event time; only already taught numbers. |
| PA1.SRV.DIR.01 | Follow or give a very short supported route | One turn first; two familiar steps as extension. Explicit map or equivalent textual reference required. |

### 4.3 Coverage accounting

60 records are not 60 independent beginner lessons. The 44 retained records include integrated performances and four Gateway aggregates. Atomic abilities may share learning sequences; integrated tasks combine them. Track four statuses separately: specified, authored, independently reviewed, and delivered. All are required before calling an objective production-covered.

For every record, track six evidence dimensions (comprehension, retrieval, production, interaction, transfer, retention) as applicable. “Not applicable” requires a reason: a sound-recognition target does not automatically require a written composition. Pronunciation, vocabulary, form control, pragmatics, mediation and strategy are cross-cutting facets attached to appropriate tasks.

## 5. Conflict and migration crosswalk

Source-qualified mappings are essential. The same bare ID may mean different things in different historical sections. An old row without a source version and interpretable payload is ambiguous and must be reviewed, not automatically upgraded.

| Source/context | Old label or content | Canonical destination and action |
| --- | --- | --- |
| Long document, initial repair dataset (§12, around line 7208) | PA1.INT.REP.01 = signal non-understanding | PA1.INT.UND.01; never map this meaning to current repetition evidence. |
| Same initial dataset | PA1.INT.REP.02 = request repetition | PA1.INT.REP.01. |
| Same initial dataset | PA1.INT.REP.03 = slower speech | PA1.INT.SLW.01. |
| Same initial dataset | PA1.INT.REP.04 = ask meaning | PA1.INT.QUE.01. |
| Same initial dataset | PA1.INT.REP.05 = request assistance | PA1.RL.HEL.01, retaining only the evidenced help-request facets. |
| Same initial dataset | PA1.INT.REP.06 = confirmation | PA1.INT.CON.01. |
| Later integration graph | PA1.INT.REP.02 = integrated repair | PA1.GAT.INT.01 only if independent assessment evidence exists; otherwise repair practice facets. |
| Portfolio and newly authored lesson | PA1.PER.IDN.01 teaches a role | Move role content to PA1.PER.ROL.01; author the retained ID as a combined profile. |
| Portfolio and newly authored lesson | PA1.WLD.NAM.01 teaches object naming | Move to PA1.WLD.OBJ.01; author familiar people/relationships for NAM.01. |
| Portfolio and newly authored lesson | PA1.WLD.OBJ.01 teaches hay/no hay | Move to PA1.WLD.EXT.01. |
| Portfolio and newly authored lesson | PA1.SRV.TIM.01 teaches whole hours | Move to PA1.SRV.CLK.01; restore today/tomorrow/now teaching for TIM.01. |
| Portfolio and newly authored lesson | PA1.SRV.LOC.01 teaches location answers | Move answer-focused content to PA1.SRV.LOC.02; author question-focused content for LOC.01. |
| Portfolio and newly authored lesson | PA1.SRV.LOC.02 teaches ordered directions | Move route-focused content to PA1.SRV.DIR.01; retain appropriate simple location-answer facets under LOC.02. |
| Portfolio and newly authored lesson | PA1.INT.QUE.01 teaches generic question words | Move to PA1.INT.QST.01; author word-meaning clarification for QUE.01. |
| Portfolio and newly authored lesson | PA1.GAT.INT.01 teaches an introduction/profile | Rehearsal belongs under PA1.RL.INT.01 or PA1.PER.IDN.01; independent profile assessment under PA1.GAT.PRO.01. |
| Portfolio and newly authored lesson | PA1.GAT.PRO.01 teaches a purchase | Rehearsal belongs under PA1.SRV.PAY.01; independent survival assessment under PA1.GAT.SUR.01. |
| Portfolio and newly authored lesson | PA1.GAT.SUR.01 teaches repair | Rehearsal belongs under the relevant repair competencies; assessment under PA1.GAT.INT.01. |
| Portfolio number sequence | 0–10 only | Partial PA1.SRV.NUM.01; add an explicit 11–20 bridge and mixed practice. Structure seed already contains 11–20 vocabulary. |
| Portfolio purchase sequence | Only ask/repeat a price | Partial PA1.SRV.PAY.01; add selection, quantity where relevant, confirmation, and accept/decline. |
| Historical PA1.PHN.*, PA1.RDG.*, PA1.WRT.*, PA1.LSN.*, PA1.SPK.* families | Alternative modality-based catalog | Map each can-do to a canonical function plus a modality facet. Bare IDs are not importable aliases; unknown historical mappings must fail validation. |

Migration procedure, for a later implementation phase:

1. Export and version current definitions, content hashes, links, and learner evidence before any mutation.
2. Classify each source record by actual meaning, modality, support and source version.
3. Relocate drafts using this crosswalk; regenerate hashes, references and review tasks.
4. Preserve original learner events. Add an audited mapping only where meaning and evidence scope genuinely match. Ambiguous or overstated evidence remains historical/unverified and can lead to reassessment.
5. Do not convert rehearsal into Gateway evidence or transfer one modality's score to another.
6. Dry-run the proposed mapping, check unknown IDs, collisions, graph cycles and content/target agreement, then review the concrete diff before database writes.
7. Reseeding and publication remain separate operations. No production reset is part of reconciliation.

## 6. Sequence and dependency policy

The nine existing units remain useful navigation groups. They are not a compulsory chain of locks.

| Unit | Outcome | Reconciled authoring order |
| --- | --- | --- |
| 1 Sound & Orientation | Begin a supported exchange | Greeting immediately; short sound work in familiar chunks; basic instructions; access to repeat/slower/non-understanding from the start. |
| 2 First Contact | Exchange names and social responses | Introduction, reciprocal name question, wellbeing, courtesy, and closure. |
| 3 Me | Share chosen familiar information | Origin and residence as separate branches; language and role; supported numbers before age; short profile and form/message tasks. |
| 4 Immediate World | Identify and discuss immediate referents | Familiar people, objects, possession, presence, color and one-feature description; signs/labels with equivalent visual/text support. |
| 5 Basic Needs | Request, accept, refuse and clarify | Want/need/preference distinction; food/drink; polite request; ability/inability; familiar action chunks. |
| 6 Everyday Survival | Use quantities, time and location practically | 0–10 then 11–20; prices; time words before clock-time extensions; location questions/answers before route extensions. |
| 7 Interaction & Repair | Choose a repair and use the result | Deepen repair already available from Unit 1; missing sound vs speed vs meaning; confirmation and missing-detail questions. |
| 8 Mini Real Life | Combine known abilities | Introduction, social, café, location and help sequences; new partner decisions and safe changes of objective. |
| 9 Gateway | Demonstrate bounded functional ability | Four assessment bundles in §9, with distinct tasks and reviewed evidence. |

Hard prerequisites are required capabilities for a task, not arbitrary order rules. Recommended exposure can guide the course without blocking a learner. Each edge carries its type and reason.

Examples:

- No hard edge from origin to residence: “Vivo en...” can be taught independently; comparison is a useful later contrast.
- Asking someone's name does not logically require mastery of stating your own. A reciprocal mission requires both.
- Age tasks require the number used in that task. Knowing numbers 0–10 does not unlock an unsupported age of nineteen.
- A clock-time task requires its selected number and time chunk, not every number up to twenty.
- A route task requires the actual direction chunks and reference system used; it must not hide an unprovided map.
- Profile integration requires its selected constituent facts. An assessment should allow fictional facts and does not require disclosing age.
- Gateway eligibility follows the task's actual prerequisites and required facets. Copying a generic confidence number from a previous lesson is insufficient.

## 7. One pedagogical sequence, several delivery forms

| Stage | Purpose | Typical valid activity | Evidence boundary |
| --- | --- | --- | --- |
| ENCOUNTER | Establish situation and useful input | Short dialogue, illustrated sign, message, or spoken request | Exposure only. |
| UNDERSTAND | Establish relevant meaning | Choose an outcome, locate a detail, follow an instruction | Keep listening and reading evidence distinct. |
| NOTICE | Reveal a useful contrast | Compare two chunks; hear stress; brief explanation | Instruction and coaching, not independent performance. |
| RECOGNIZE | Identify the target in varied input | Different recording, suitable response discrimination | Recognition is not retrieval. |
| RETRIEVE | Recall without a visible answer | Situation cue, incomplete information, short spoken/written response | Record every hint or model shown. |
| PRODUCE | Express an intended meaning | Guided construction followed by a less-supported personal/role response | Copying and independent construction are different. |
| INTERACT | Respond to another person's contribution | Contingent turns, clarification, correction, acceptance/refusal | A static two-sided script is a worked example, not interaction evidence. |
| TRANSFER | Apply known language in a new situation | Held-out task with a meaningful change of partner, medium, or goal | No rehearsed task, answer frame or leaked rubric answer. |
| RETAIN | Demonstrate access after an actual delay | New cue and equivalent task after the last relevant practice | Scheduled date is not performance evidence. |

The earlier eleven steps map as follows: context → ENCOUNTER; comprehension and meaning explanation → UNDERSTAND/NOTICE; controlled practice → RECOGNIZE or guided PRODUCE according to the task; retrieval → RETRIEVE; production → PRODUCE; interaction → INTERACT; transfer → TRANSFER; assessment → observation across stages; spaced revisit → RETAIN.

A session can cover a subset of stages. Transfer and retention normally occur in later delivery. No author should insert meaningless exercises merely to fill nine slots. Repeated questions are review of the same item, not additional independent observations.

Mode contracts: Story establishes context and meaning; Drill targets discrimination, recall or controlled form; Immersion requires responsive comprehension/interaction; Professional applies known language to an appropriate workplace/study context; Mission combines skills around a goal. Professional mode is optional for a given beginner objective. A mode label alone never determines evidence type.

## 8. Evidence and mastery contract

Six states are retained. Evidence is stored separately from the label and remains inspectable.

| State | Meaning | Minimum pilot policy |
| --- | --- | --- |
| NOT_STARTED | No usable learning evidence | No qualifying encounter recorded. |
| EXPOSED | Encountered relevant language | Exposure recorded; no competence claim. |
| DEVELOPING | Some meaning/use demonstrated | At least one interpretable response; gaps or support remain. |
| CONTROLLED | Can perform the target under defined support | Two successful observations on distinct items; include a use/action task rather than recognition alone where the competency requires use. |
| TRANSFERRED | Can apply the target beyond rehearsal | Two successful held-out context observations on separate sessions, with relevant modality/facets and no supplied answer model. |
| RETAINED | Transferable ability remains accessible after delay | Successful delayed checks at least 7 and 30 days after the last relevant practice, using non-identical tasks and eligible evidence. |

These counts and delay windows are explicit ECLA pilot decisions, not established universal thresholds. They permit deterministic implementation and must be evaluated with learner data before certification claims. A learner remains able to progress in practice while retention evidence matures; a 30-day check is not a compulsory lock on all new study.

Scoring anchors for a task: 0 = intended outcome not achieved; 1 = partly achieved or achieved only after a supplied answer; 2 = outcome achieved within allowed support. Store assistance independently. A model-assisted success can be useful learning evidence but cannot satisfy independent transfer. A task may record clear meaning with a form error; those dimensions must not collapse into a single pass/fail.

Every evidence record needs: learner, canonical competency/version, task/content version, context fingerprint, modality, raw response or consented observation reference, allowed and used assistance, observed outcome, rubric/evaluator version, confidence/uncertainty, timestamp, reviewer state and evidence purpose. Store speaking intelligibility only when actual audio or a qualified listener observation supports it. Transcripts alone cannot establish acoustics.

Low-confidence automated evaluation routes to review or another equivalent observation. Contradictory later evidence flags the affected dimension and triggers repair/reassessment; retain historical evidence rather than deleting or silently rewriting it. The current learner view must distinguish historical attainment from current confidence and recency.

Timing/automaticity measures exclude network delay, device failure and reasonable accessibility accommodations. Do not infer internal psychological confidence from microphone behavior, accent or response speed.

## 9. Gateway: four bundles, multiple real tasks

Earlier five/six-scenario lists are task examples, not five/six competing Gateway competencies. The current application's seven-situation implementation is also a delivery choice, not a new curriculum definition. Preserve four named bundles:

| Bundle | Required demonstrations | Insufficient evidence |
| --- | --- | --- |
| PA1.GAT.PRO.01 — Profile | Short spoken exchange with chosen facts; separate simple written profile/form task; respond to a changed question order | A memorized monologue alone; writing used to claim speaking. |
| PA1.GAT.SUR.01 — Survival | Bounded request/transaction; interpret a supported response; accept, decline or correct according to the goal | Selecting the phrase without using the response. |
| PA1.GAT.INT.01 — Repair | Identify a gap, choose an appropriate repair, and use the clarified information | Saying a repair phrase when no breakdown occurred or ignoring the clarification. |
| PA1.GAT.MIS.01 — Integration | Held-out practical goal using known language; short location/help or comparable task; familiar written information where relevant | Replaying a practised script or introducing untaught complexity as a surprise. |

Pilot decision: all four bundles need successful reviewed evidence in their required facets, with equivalent alternate tasks available for retries. Do not average away an absent speaking, reading or repair demonstration. The number of prompts can vary by task design. A fixed “five of seven” policy must not override these coverage requirements.

Report “ECLA Pre-A1 Gateway demonstrated under stated conditions,” not external CEFR certification. Separate Gateway completion from delayed retention status. New curriculum rules do not automatically replace existing assessment gates; any later implementation must reconcile the existing reviewed-rubric/acoustic-review controls without bypassing them.

## 10. Content acceptance standard

The unit of authoring is a competency learning package, not an arbitrary quota of sentences. Every package must provide:

1. An explicit can-do, facets, language targets, prerequisites and support boundary.
2. At least two developed practice contexts with genuinely different communicative demands, plus two held-out transfer contexts. Aggregate missions reference their constituent packages and add their own task briefs; they need not duplicate atomic teaching.
3. At least one complete worked example in each developed practice context, with natural partner roles and a clear outcome. Every dialogue turn must serve the situation. A recording script is not a claim that the recording exists.
4. Contextual comprehension/discrimination and retrieval work whose answers, alternatives, distractors and explanations are correct. Distractors must represent a relevant misunderstanding, not absurd alternatives or multiple valid answers.
5. At least two output opportunities per required productive modality, with decreasing answer support. Input-only competencies have a documented alternative action-based demonstration.
6. A contingent interaction: what the partner does after success, a partial response, an unclear response, refusal, or a request for repair. Include at least one meaningful change of information or availability.
7. Common-error guidance that distinguishes form, meaning, pragmatics, comprehension and task strategy; specify a corrective activity and a subsequent reassessment task.
8. Listening with at least two reviewed deliveries for a listening target; a broader course-level variety plan. Authentic variety cannot be proved by writing a locale label. Use intelligibility as the production goal, not imitation of a preferred accent.
9. A held-out transfer definition with an exposure check and no answer leakage; delayed retrieval variants with an actual eligibility rule.
10. Accessibility and privacy provisions; independent language/cultural review tied to the exact content version; acceptance checks in §12.

The proposed “two practice plus two transfer” minimum is an ECLA release policy, subject to pilot revision. It is intentionally not a claim that four contexts scientifically prove mastery. New contexts must not be copied with only a proper name changed.

Content that remains at one worked dialogue plus a generic third-context prompt is a partial draft. The 44 lessons authored in commit `833fdd6` are reusable draft material, not completed packages under this standard. The conflicts in §5 must be resolved before extending them.

## 11. Interaction, remediation, retention and accessibility

### Worked authoring example: requesting water

Practice setting: a café counter with water and coffee available. Productive chunks: `Agua, por favor`, `Sí, gracias`, `No, gracias`; receptive chunk: `¿Agua?`. A later practice sequence can add `Sin gas, por favor` after teaching con/sin gas explicitly.

Partner branches:

| Learner contribution | Partner behavior | Educational response |
| --- | --- | --- |
| Clear request for water | Confirms water and continues | Record the request; next observe whether learner understands the confirmation. |
| Clear request for coffee despite a water role goal | Confirms coffee naturally | Mark goal mismatch; after the exchange explain the item contrast, then retry with a new cue. |
| Unclear response | Asks a short clarification | Record breakdown; permit a repetition or simpler noun request. |
| “¿Puedes repetir?” | Repeats the actual last message slowly | Observe whether the learner then uses the information. |
| “No, gracias” to an optional alternative | Accepts refusal and offers closure | Success when refusal matches the role goal. |
| No response because audio failed | Offers technical recovery or text-supported practice | Record technical failure, not a language error. |

Near transfer: request a familiar item at another counter without a sentence frame. Broader transfer within level: request that same familiar item at a community desk from a different partner. Do not add unfamiliar item names, prices, a new register and background noise simultaneously. If all equivalent contexts have already been exposed, create/review a new one or label the attempt practice; do not falsely report novelty.

Remediation example: confusing `No quiero` and `No entiendo` triggers a short contrast between refusal and comprehension breakdown, followed by a new situational retrieval task. A missing ñ in typed `años` receives orthographic feedback; it is not by itself evidence of unintelligible speech.

Retention starting schedule: Day 1 instruction; Day 2 retrieval; Day 4 varied practice; Day 7 interaction; Day 14 transfer; Day 30 follow-up. This is a practice schedule, not six guaranteed promotions. Delayed evidence uses time since the last relevant practice, including overlapping tasks; a rehearsal immediately before the check resets the meaningful delay for that target.

Accessibility: provide replay, adjustable instructional pacing, readable text, keyboard controls, caption/translation options for practice, and equivalent textual referents for maps or color-dependent tasks. If an accommodation changes the measured modality, record that change rather than claiming the original listening/speaking construct. No-microphone users can continue other dimensions; their speaking status remains unassessed until appropriate evidence exists. Interruptions, low bandwidth, fatigue or disability are not language mistakes.

Learner identity is optional. Use role cards for personal facts, require appropriate consent for recordings, minimize retention of raw audio, and keep review access controlled. These are product requirements; legal compliance must be evaluated separately for actual deployment jurisdictions.

## 12. Definition of done and implementation handoff

Before content expansion:

- Adopt this registry and source-qualified crosswalk as the review baseline.
- Inventory every existing lesson, portfolio entry, phase override, scene, mission and evidence link by actual meaning.
- Mark partial coverage and semantic mismatches explicitly; do not hide them behind a count of valid IDs.
- Implement semantic checks: the target, task, expected answer and rubric must assess the same ability.

Before a package is publishable:

- All required facets and §10 package components exist; language targets and support are explicit.
- All referenced IDs exist; hard dependencies have reasons and no cycles; a usable beginner path exists.
- Models contain no unfilled slots. An authoring pattern may contain a slot; a learner-facing example or scored answer may not.
- Every choice item has a valid answer policy and an explanation; alternative natural responses are accepted in context.
- Public transfer delivery contains no answer models, hidden rubric keys or repair strategies supplied as the answer.
- Media exists and matches its transcript, locale and accessibility metadata. TTS fallback is labelled honestly.
- Independent reviewers approve language and culture for the exact content version. Automated tests cannot create those approvals.
- Pilot learners demonstrate understandable instructions and plausible difficulty; failure patterns feed revision.

Implementation order after this specification:

1. Add a versioned registry and crosswalk validator, with a read-only report of existing conflicts.
2. Resolve semantic drift and introduce the 16 new records in an isolated development migration.
3. Re-author three benchmark packages: greetings, requests, and word-meaning repair. Include complete practice, interaction, held-out transfer and delayed evidence contracts.
4. Review the benchmark packages against this standard, then expand the remaining packages using the same acceptance gate.
5. Align legacy and canonical delivery, including recorded support, evidence facets and actual modality.
6. Validate migration behavior and content hashes in a development database; review the proposed release diff.
7. Obtain independent educational/language reviews and conduct the learner pilot before publication claims.

Reconciliation completion checklist: canonical semantics defined; 44 old IDs preserved; 16 new IDs uniquely specified; source conflicts mapped; lesson-stage/state distinctions settled; Pre-A1 support and grammar boundaries stated; package criteria explicit; evidence and Gateway policy explicitly labelled as pilot decisions; production changes not performed.

This document settles the design decisions needed to resume disciplined authoring. It does not certify the efficacy of the curriculum, claim a complete A1–C2 syllabus, or authorize a production migration. A1–C2 will need their own descriptor-linked inventories, packages and validation; retain the shared architecture without pretending those courses are already written.

## 13. CEFR traceability baseline

Primary reference: Council of Europe (2020), [Common European Framework of Reference for Languages: Learning, teaching, assessment — Companion Volume](https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4).

| ECLA area | Relevant official scale | Mapping status |
| --- | --- | --- |
| Supported listening and instructions | Overall oral comprehension; Understanding announcements and instructions, printed pp. 48–51 | Pre-A1 descriptors explicitly include slow delivery and support. Individual ECLA items still need descriptor-level review. |
| Familiar signs, labels and simple texts | Overall reading comprehension; Reading for orientation; Reading instructions, pp. 54–58 | Use the applicable descriptor and its support conditions, not the title alone. |
| Personal facts and formulaic exchanges | Overall oral interaction; Understanding an interlocutor; Information exchange, pp. 72–80 | Pre-A1 personal-information and number functions are relevant; richer task variants may exceed the core boundary. |
| Simple written information | Overall written production; Notes, messages and forms | Map individual written tasks separately from spoken ability. |
| Repair, pronunciation and strategic behavior | Asking for clarification; Phonological control; relevant interaction descriptors | Some detailed scales do not supply a Pre-A1 descriptor. Mark ECLA instructional objectives as internal rather than inventing an official descriptor. |
| Mediation and online interaction | Relevant mediation and online interaction scales | Include level-appropriate supported tasks where useful; do not impose an advanced descriptor as a beginner requirement. |

Before external alignment claims, each assessed task must record the official scale, exact descriptor reference, level, assistance conditions, and reviewer rationale—or explicitly state “ECLA internal instructional objective.” The source documents' broad CEFR language is not itself a completed alignment study. Internal mastery states and the 60-record count are not CEFR classifications.

## 14. Source and decision ledger

| Source location | Evidence used | Reconciliation |
| --- | --- | --- |
| eclav2.md lines 84–114 | 25 constitutional articles | Preserved as educational principles; clarified operational contracts. |
| eclav2.md lines 324–395 and 567 | Competing loops, scales and schedule | §§7–8 and 11 separate stages, evidence, state and practice timing. |
| Ecla(1).md lines 7204–7246 and 12607–12625 | Same repair ID assigned different meanings | Source-qualified crosswalk in §5. |
| Ecla(1).md reading/writing dataset around 6925–6995 | Explicit literacy objectives | New literacy records and separate modality evidence. |
| Ecla(1).md action/possession material around 7097–7150 and 14925–14949 | Functions beyond the current authored package set | New possession/action records; no silent claim of existing coverage. |
| Ecla(1).md lesson 5.2 around 8883–8897; seed.ts number vocabulary | Explicit 11–20 progression | Complete the instructional bridge; do not remove numbers just because the new draft omitted them. |
| Ecla(1).md around 12738–12762 | Graduation dimensions but thresholds deferred | Explicit pilot policies, with evidence and review limitations. |
| Ecla(1).md around 13555–13580 | Modes need not be equally represented | Optional mode-specific delivery governed by learning purpose. |
| eclav2.md line 500; Ecla(1).md around 14596–14612 | Incorrect stress example | GRA-cias; further phonology remains reviewable. |
| Repository seed.ts vs portfolio.ts and lessons.ts | Identity/world/time/location/repair/Gateway semantic drift | Preserve historical semantics and relocate drafts; no mutation in this task. |

The numbers of contexts, observations, productive chunks and retention days in this specification are explicit authoring/pilot choices. They are not findings extracted from CEFR or empirically validated facts. These decisions can be revised through a new version after review and learner evidence, without rewriting historical records.
