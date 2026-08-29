import { Prisma, PrismaClient, ExperienceType } from "@prisma/client";

/**
 * ECLA — Sub-Lesson Content Seeder (CONTENT LAYER)
 *
 * Division of labor:
 *   seed.ts           → structure: language, course, units, competencies,
 *                       realizations, vocabulary, prerequisites, base experiences
 *   seedSublessons.ts → depth: 9-stage engine payload + assessment contract +
 *                       missions + player-native legacy bridge exercises
 *
 * Merge decisions (v1.0):
 *   1. STAGES / support / record keys cleaned — stage switch now actually matches.
 *   2. IDs aligned with seed.ts:
 *        experience: `${competency.id}-${type}`   (overwrites, no duplicates)
 *        mission:    `${competency.id}-gateway`   (converges with seed.ts)
 *   3. Legacy bridge exercises are player-native + gradable (match, fill_blank,
 *      listen_choose, listen_type, mcq, translate) with accept[] for Phase 1.
 *   4. Engine payload (subLessons, assessment, mission config) preserved —
 *      the current player ignores it; Phases 2–4 will consume it.
 *
 * Deterministic + idempotent: safe to re-run any time.
 */
import { phases } from './content/phases'
import { validatePhases } from './content/validate'
import type { CompetencyContent } from './content/types'

/** Retry transient Neon connection drops (P1017/P1008) with backoff */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn()
        } catch (e: any) {
            const retryable = ['P1017', 'P1008', 'P1011'].includes(e?.code) ||
                String(e?.message ?? '').includes('closed the connection')
            if (!retryable || i === attempts - 1) throw e
            const wait = 2000 * (i + 1)
            console.warn(`DB connection dropped — retrying in ${wait}ms (${i + 2}/${attempts})…`)
            await new Promise(r => setTimeout(r, wait))
        }
    }
    throw new Error('unreachable')
}
const prisma = new PrismaClient();

const VERSION = "ecla-sublessons-v1.0";

// ── The reusable 9-stage formula (§11) ──
const STAGES = [
    "ENCOUNTER",
    "UNDERSTAND",
    "NOTICE",
    "RECOGNIZE",
    "RETRIEVE",
    "PRODUCE",
    "INTERACT",
    "TRANSFER",
    "RETAIN",
] as const;

type Stage = (typeof STAGES)[number];
type JsonObject = Record<string, unknown>;
type VocabItem = { word: string; translation: string };

type Target = {
    chunks: string[];
    patterns: string[];
    examples: string[];
    vocabulary: string[];
    vocabItems: VocabItem[];
    grammar?: string;
    pronunciation?: string;
    culture?: string;
};

type Activity = {
    id: string;
    stage: Stage;
    type: string;
    title: string;
    purpose: string;
    prompt?: string;
    input?: unknown;
    expectedOutput?: unknown;
    constraints?: string[];
    evaluation?: JsonObject;
};

type SubLesson = {
    id: string;
    order: number;
    stage: Stage;
    title: string;
    objective: string;
    learnerAction: string;
    support: "maximum" | "high" | "medium" | "low" | "minimal";
    activities: Activity[];
};

// ─────────────────────────── utils ───────────────────────────

function slug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function cleanStrings(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function cleanVocabWords(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object" && "word" in item) {
                const w = (item as { word?: unknown }).word;
                return typeof w === "string" ? w : null;
            }
            return null;
        })
        .filter((x): x is string => Boolean(x));
}

function cleanVocabItems(value: unknown): VocabItem[] {
    if (!Array.isArray(value)) return [];
    const out: VocabItem[] = [];
    for (const item of value) {
        if (item && typeof item === "object" && "word" in item && "translation" in item) {
            const v = item as { word?: unknown; translation?: unknown };
            if (typeof v.word === "string" && typeof v.translation === "string") {
                out.push({ word: v.word, translation: v.translation });
            }
        }
    }
    return out;
}

function first<T>(items: T[], fallback: T): T {
    return items[0] ?? fallback;
}

function unique<T>(items: T[]): T[] {
    return [...new Set(items)];
}

// Deterministic RNG so re-seeds are byte-identical
function hashSeed(s: string): number {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
}
function mulberry32(a: number): () => number {
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function shuffle<T>(r: () => number, arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Blank one content word from a pattern → fill_blank exercise. */
function blankPattern(p: string): { prompt: string; answer: string; accept: string[] } | null {
    const words = p.split(" ");
    if (words.length < 2) return null;
    const cands = words
        .map((w, i) => ({ w, i }))
        .filter(({ w, i }) => i > 0 && w.replace(/[^a-záéíóúñü]+/gi, "").length >= 3);
    if (!cands.length) return null;
    const pick = cands[cands.length - 1];
    return {
        prompt: words.map((w, i) => (i === pick.i ? "___" : w)).join(" "),
        answer: pick.w,
        accept: [],
    };
}

// ─────────────────────── target assembly ───────────────────────

function targetFromCompetency(competency: any, realization: any, vocabulary: any[]): Target {
    return {
        chunks: unique([...cleanStrings(realization?.patterns), ...cleanStrings(competency?.patterns)]),
        patterns: unique([...cleanStrings(realization?.patterns), ...cleanStrings(competency?.patterns)]),
        examples: unique([...cleanStrings(realization?.examples), ...cleanStrings(competency?.examples)]),
        vocabulary: unique([...vocabulary.map((v) => v.word).filter(Boolean), ...cleanVocabWords(competency?.vocabulary)]),
        vocabItems: unique(cleanVocabItems(vocabulary).map((v) => JSON.stringify(v))).map((s) => JSON.parse(s)),
        grammar: realization?.grammarNote ?? competency?.grammarNote ?? undefined,
        pronunciation: realization?.pronunciationNote ?? competency?.pronunciationNote ?? undefined,
        culture: realization?.culturalNote ?? competency?.culturalNote ?? undefined,
    };
}

function targetExample(target: Target): string {
    return first(target.examples, first(target.patterns, "the target expression"));
}

function targetChunkList(target: Target): string[] {
    return target.chunks.length ? target.chunks.slice(0, 6) : target.examples.slice(0, 6);
}

// ─────────────────────── support ladder (§3.4) ───────────────────────

function supportFor(stage: Stage): SubLesson["support"] {
    switch (stage) {
        case "ENCOUNTER": return "maximum";
        case "UNDERSTAND": return "maximum";
        case "NOTICE": return "high";
        case "RECOGNIZE": return "high";
        case "RETRIEVE": return "medium";
        case "PRODUCE": return "medium";
        case "INTERACT": return "low";
        case "TRANSFER": return "minimal";
        case "RETAIN": return "minimal";
    }
}

// ─────────────────── evaluation contract (form vs function) ───────────────────

function baseEvaluation(stage: Stage, competency: any): JsonObject {
    const functionCriteria = [
        "intended_meaning_communicated",
        "appropriate_response_or_action",
        "task_continued_when_possible",
    ];
    const formCriteria = ["target_language_used", "intelligible_output"];

    if (String(competency.domain).toUpperCase().includes("INTERACTION") || String(competency.code).includes("INT")) {
        functionCriteria.push("interaction_maintained");
    }
    if (
        String(competency.code).includes("REP") ||
        String(competency.code).includes("UND") ||
        String(competency.title).toLowerCase().includes("repair")
    ) {
        functionCriteria.push("misunderstanding_repaired");
    }

    return {
        stage,
        form: { criteria: formCriteria, weight: stage === "TRANSFER" ? 0.35 : 0.5 },
        function: { criteria: functionCriteria, weight: stage === "TRANSFER" || stage === "INTERACT" ? 0.65 : 0.5 },
        masteryEvidence: stage === "RETAIN" || stage === "TRANSFER",
    };
}

function makeActivity(
    competency: any,
    target: Target,
    stage: Stage,
    index: number,
    data: Omit<Activity, "id" | "stage" | "evaluation">,
): Activity {
    return {
        ...data,
        id: `${slug(competency.code)}-${stage.toLowerCase()}-${index + 1}`,
        stage,
        evaluation: baseEvaluation(stage, competency),
    };
}

// ─────────────────────── 9-stage sub-lesson builder ───────────────────────

function stageTitle(stage: Stage): string {
    const titles: Record<Stage, string> = {
        ENCOUNTER: "Encounter",
        UNDERSTAND: "Understand",
        NOTICE: "Notice",
        RECOGNIZE: "Recognize",
        RETRIEVE: "Retrieve",
        PRODUCE: "Produce",
        INTERACT: "Interact",
        TRANSFER: "Transfer",
        RETAIN: "Retain",
    };
    return titles[stage];
}

function stageObjective(stage: Stage, canDo: string): string {
    const objectives: Record<Stage, string> = {
        ENCOUNTER: `Meet language that is useful for: ${canDo}`,
        UNDERSTAND: `Understand the communicative meaning needed to: ${canDo}`,
        NOTICE: `Notice the reusable language pattern used to: ${canDo}`,
        RECOGNIZE: `Recognize the target when hearing or seeing it in context while trying to: ${canDo}`,
        RETRIEVE: `Retrieve useful language from memory in order to: ${canDo}`,
        PRODUCE: `Produce understandable language independently enough to: ${canDo}`,
        INTERACT: `Use the competency with another person to: ${canDo}`,
        TRANSFER: `Transfer the competency to an unfamiliar but appropriate situation: ${canDo}`,
        RETAIN: `Retrieve and use the competency after delay: ${canDo}`,
    };
    return objectives[stage];
}

function learnerAction(stage: Stage): string {
    const actions: Record<Stage, string> = {
        ENCOUNTER: "listen and notice the situation",
        UNDERSTAND: "infer and confirm meaning",
        NOTICE: "notice the useful pattern and pronunciation",
        RECOGNIZE: "identify the target from meaningful alternatives",
        RETRIEVE: "recall the target without looking",
        PRODUCE: "create an understandable response",
        INTERACT: "respond to a partner and keep the exchange moving",
        TRANSFER: "solve a new situation with minimal support",
        RETAIN: "retrieve the competency after a delay",
    };
    return actions[stage];
}

function buildSubLesson(competency: any, target: Target, stage: Stage, order: number): SubLesson {
    const canDo = competency.canDo as string;
    const example = targetExample(target);
    const chunks = targetChunkList(target);
    const activities: Activity[] = [];

    switch (stage) {
        case "ENCOUNTER":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "context",
                    title: "Meet the language in context",
                    purpose: "Give the learner a meaningful first encounter before explanation.",
                    input: {
                        scenario: `A short, realistic situation where the learner needs to ${canDo.toLowerCase()}.`,
                        targetLanguage: example,
                        translationPolicy: "hidden_by_default",
                    },
                    constraints: [
                        "use only language appropriate to the learner's level",
                        "do not begin with grammar terminology",
                        "make the communicative purpose obvious from context",
                    ],
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "listening",
                    title: "First hearing",
                    purpose: "Let the learner hear the target naturally before producing it.",
                    prompt: "Listen once for the situation. Listen again for the target expression.",
                    input: { utterances: chunks.slice(0, 3), speed: "slow_natural" },
                    expectedOutput: "identify_the_target_in_context",
                }),
            );
            break;
        case "UNDERSTAND":
            activities.push(
                makeActivity(competency, target, stage, 1, {
                    type: "comprehension",
                    title: "Meaning in a second context",
                    purpose: "Confirm that meaning survives a new but familiar situation.",
                    prompt: "Choose what the learner should understand from the exchange.",
                    input: {
                        scenarioVariant: "new_context_same_function",
                        target: example,
                        options: [
                            `They are trying to ${canDo.toLowerCase()}.`,
                            "They are ending the conversation.",
                            "They are asking for help.",
                        ],
                    },
                    expectedOutput: `They are trying to ${canDo.toLowerCase()}.`,
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "reading_comprehension",
                    title: "Read and understand",
                    purpose: "Connect written Spanish to communicative meaning.",
                    prompt: "Read the line. What is happening?",
                    input: {
                        passage: example,
                        options: [
                            `They are trying to ${canDo.toLowerCase()}.`,
                            "They are ending the conversation.",
                            "They are asking for help.",
                        ],
                    },
                    expectedOutput: `They are trying to ${canDo.toLowerCase()}.`,
                }),
            );
            break;
        case "NOTICE":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "noticing",
                    title: "Notice the useful pattern",
                    purpose: "Help the learner see the reusable form without overloading them.",
                    prompt: "Look at the expression. What part stays useful when the situation changes?",
                    input: { patterns: chunks.slice(0, 5), grammar: target.grammar ?? null },
                    expectedOutput: "identify_reusable_pattern",
                    constraints: ["meaning first", "short explanation", "no unnecessary terminology"],
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "pronunciation",
                    title: "Make it intelligible",
                    purpose: "Build intelligible pronunciation rather than imitation of a native accent.",
                    prompt: "Listen, notice stress and rhythm, then repeat.",
                    input: {
                        target: example,
                        note: target.pronunciation ?? "Prioritize clear vowels, stress, and understandable rhythm.",
                    },
                    expectedOutput: "intelligible_repetition",
                }),
            );
            break;
        case "RECOGNIZE":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "recognition",
                    title: "Recognize the function",
                    purpose: "Distinguish the target from plausible but wrong alternatives.",
                    prompt: `Which expression helps you ${canDo.toLowerCase()}?`,
                    input: {
                        options: unique([...chunks.slice(0, 3), "Hasta luego.", "No entiendo.", "Gracias."]).slice(0, 5),
                    },
                    expectedOutput: example,
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "listening_discrimination",
                    title: "Hear it among alternatives",
                    purpose: "Strengthen listening recognition rather than visual recognition only.",
                    input: { target: example, distractors: chunks.slice(1, 4), presentation: "audio_first" },
                    expectedOutput: "target_identified_from_audio",
                }),
            );
            break;
        case "RETRIEVE":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "recall",
                    title: "Retrieve from memory",
                    purpose: "Move the learner from recognition to active retrieval.",
                    prompt: `Without looking at the answer, say what you would use to ${canDo.toLowerCase()}.`,
                    input: { cue: canDo, support: "meaning_only" },
                    expectedOutput: {
                        accepted: targetChunkList(target),
                        minimum: "communicatively_appropriate_target",
                    },
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "completion",
                    title: "Complete the pattern",
                    purpose: "Practice controlled manipulation without turning the task into a translation test.",
                    prompt: "Complete the expression for the new situation.",
                    input: { sentenceFrame: first(target.patterns, example), variableSlot: "contextual_element" },
                    expectedOutput: "grammatical_and_communicative_completion",
                }),
            );
            break;
        case "PRODUCE":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "guided_speaking",
                    title: "Say it yourself",
                    purpose: "Produce the target with decreasing support.",
                    prompt: `Say something that allows you to ${canDo.toLowerCase()}.`,
                    input: { cue: canDo, support: chunks.slice(0, 2) },
                    expectedOutput: { function: canDo, examples: target.examples.slice(0, 4) },
                    constraints: [
                        "meaning matters more than exact wording",
                        "accept valid equivalent beginner phrasing",
                        "evaluate pronunciation for intelligibility",
                    ],
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "writing_production",
                    title: "Write it yourself",
                    purpose: "Connect literacy to production at beginner level.",
                    prompt: `Write a short sentence to ${canDo.toLowerCase()}.`,
                    input: { scenario: `You need to ${canDo.toLowerCase()}.` },
                    expectedOutput: "written_communicative_response",
                }),
            );
            break;
        case "INTERACT":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "guided_interaction",
                    title: "Use it with a partner",
                    purpose: "Turn production into actual interaction.",
                    prompt: "Respond to the partner and continue the exchange for at least one turn.",
                    input: {
                        partnerRole: "supportive_native_or_ai_partner",
                        opening: example,
                        followUpPolicy: "natural_short_response",
                    },
                    expectedOutput: "appropriate_interactive_response",
                    constraints: [
                        "partner does not say Correct every turn",
                        "partner responds naturally",
                        "allow repair when comprehension breaks down",
                    ],
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "role_play",
                    title: "Handle a small variation",
                    purpose: "Prevent memorization from being mistaken for communicative ability.",
                    input: { variation: "same_function_new_person_place_or_object", targetFunction: canDo },
                    expectedOutput: "successful_exchange",
                }),
            );
            break;
        case "TRANSFER":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "simulation",
                    title: "Use it in a new situation",
                    purpose: "Test whether the competency transfers beyond the practiced example.",
                    prompt: `Complete a new situation where you need to ${canDo.toLowerCase()}.`,
                    input: {
                        context: "unseen_but_level_appropriate",
                        speakerVariation: true,
                        lexicalVariation: true,
                        support: "minimal",
                    },
                    expectedOutput: "task_completed_with_communicative_success",
                    constraints: [
                        "no exact memorized answer required",
                        "do not introduce unrelated grammar",
                        "accept natural equivalent wording",
                    ],
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "unexpected_interaction",
                    title: "Handle an unexpected change",
                    purpose: "Measure adaptability when the situation is not identical to practice.",
                    input: { change: "partner_changes_one_relevant_detail", targetFunction: canDo, support: "minimal" },
                    expectedOutput: "adapted_response_or_repair",
                }),
            );
            break;
        case "RETAIN":
            activities.push(
                makeActivity(competency, target, stage, 0, {
                    type: "spaced_retrieval",
                    title: "Retrieve after a delay",
                    purpose: "Check durable access rather than immediate lesson performance.",
                    prompt: `Without reviewing the lesson, use Spanish to ${canDo.toLowerCase()}.`,
                    input: { delayPolicy: [1, 2, 4, 7, 14, 30], cue: "meaning_or_situation_only" },
                    expectedOutput: "independent_retrieval",
                }),
                makeActivity(competency, target, stage, 1, {
                    type: "mixed_context_review",
                    title: "Use it again in a different context",
                    purpose: "Confirm retention plus transfer.",
                    input: { context: "different_from_initial_learning", targetFunction: canDo },
                    expectedOutput: "retained_and_transferable_use",
                }),
            );
            break;
    }

    return {
        id: `${slug(competency.code)}-${stage.toLowerCase()}`,
        order,
        stage,
        title: stageTitle(stage),
        objective: stageObjective(stage, canDo),
        learnerAction: learnerAction(stage),
        support: supportFor(stage),
        activities,
    };
}

// ─────────────────────── assessment contract (§6.4/6.5) ───────────────────────

function assessmentFor(competency: any, target: Target): JsonObject {
    const code = competency.code as string;
    const canDo = competency.canDo as string;
    const interaction = code.includes("INT") || String(competency.domain).toUpperCase() === "INTERACTION";
    const repair = code.includes("REP") || code.includes("UND") || String(competency.title).toLowerCase().includes("repair");

    return {
        frameworkVersion: VERSION,
        principle: "Evidence of ability, not lesson completion.",
        form: { dimensions: ["grammar", "vocabulary", "pronunciation"], diagnosticOnly: false },
        function: {
            dimensions: [
                "meaning_communicated",
                "appropriate_response",
                "task_continued",
                ...(interaction ? ["interaction"] : []),
                ...(repair ? ["repair"] : []),
            ],
        },
        evidence: {
            controlled: `${canDo} under strong support`,
            guided: `${canDo} with contextual support`,
            spontaneous: `${canDo} without a sentence frame`,
            unexpected: `${canDo} after a small contextual change`,
            delayed: `${canDo} after spaced delay`,
            transfer: `${canDo} in an unseen context`,
        },
        mastery: {
            minimumEvidence: ["controlled", "guided", "spontaneous", "transfer", "delayed"],
            interactionRequired: interaction,
            repairRequired: repair,
            exactWordingRequired: false,
            intelligibilityRequired: true,
            repeatedContextsRequired: true,
        },
        retention: { scheduleDays: [1, 2, 4, 7, 14, 30], rescheduleOnFailure: true, rescheduleOnSuccess: true },
        languageTargets: {
            chunks: target.chunks.slice(0, 12),
            patterns: target.patterns.slice(0, 12),
            vocabulary: target.vocabulary.slice(0, 20),
            grammar: target.grammar ?? null,
            pronunciation: target.pronunciation ?? null,
            culture: target.culture ?? null,
        },
    };
}

// ─────────────────────── experience content (dual contract) ───────────────────────

function buildExperienceContent(competency: any, target: Target, type: ExperienceType): JsonObject {
    const canDo = competency.canDo as string;
    const subLessons = STAGES.map((stage, index) => buildSubLesson(competency, target, stage, index + 1));

    const modePurpose: Record<ExperienceType, string> = {
        [ExperienceType.STORY]: "context_and_meaning",
        [ExperienceType.DRILL]: "retrieval_and_automaticity",
        [ExperienceType.IMMERSION]: "spontaneous_interaction",
        [ExperienceType.PROFESSIONAL]: "purposeful_application",
        [ExperienceType.MISSION]: "transfer_assessment",
    };

    return {
        schema: VERSION,
        language: "es",
        level: "PRE_A1",
        competency: { code: competency.code, title: competency.title, canDo, domain: competency.domain },
        pedagogy: {
            sequence: STAGES,
            supportRemoval: "maximum -> minimal",
            formFunctionSplit: true,
            transferRequired: true,
            retentionRequired: true,
        },
        languageTargets: {
            chunks: target.chunks,
            patterns: target.patterns,
            examples: target.examples,
            vocabulary: target.vocabulary,
            grammar: target.grammar ?? null,
            pronunciation: target.pronunciation ?? null,
            culture: target.culture ?? null,
        },
        subLessons,
        modePurpose: modePurpose[type],
    };
}

/** Merge hand-written content over generic generation (engine payload only — Phase 21). */
function applyOverride(base: any, o: CompetencyContent | undefined, type: ExperienceType, target: Target): any {
    if (!o) return base
    if (o.pronunciation?.length) {
        base.languageTargets.pronunciation = o.pronunciation.map(p => `${p.target}: ${p.note}`).join(' · ')
    }
    if (o.culture) base.languageTargets.culture = o.culture

    const patchStage = (stage: string, actType: string, patch: (act: any) => void) => {
        const sl = base.subLessons?.find((s: any) => s.stage === stage)
        const act = sl?.activities?.find((a: any) => a.type === actType)
        if (act) patch(act)
    }

    if (o.listening?.length) {
        patchStage('ENCOUNTER', 'listening', act => {
            act.input = { ...(act.input ?? {}), utterances: o.listening!.map(l => l.utterance) }
        })
    }

    switch (type) {
        case ExperienceType.STORY:
            if (o.story) {
                patchStage('ENCOUNTER', 'context', act => {
                    act.input = { ...(act.input ?? {}), scenario: o.story!.beat }
                })
            }
            break
        case ExperienceType.DRILL:
            if (o.drill?.length) {
                const item = o.drill[0]
                patchStage('RETRIEVE', 'recall', act => {
                    act.prompt = item.prompt
                    act.expectedOutput = { accepted: [item.answer, ...(item.accept ?? [])] }
                })
            }
            break
        case ExperienceType.IMMERSION:
            if (o.immersion?.script?.length) {
                const lines = o.immersion.script.map(s => s.line)
                patchStage('ENCOUNTER', 'listening', act => {
                    act.input = { ...(act.input ?? {}), utterances: lines }
                })
            }
            break
        case ExperienceType.PROFESSIONAL:
            if (o.professional) {
                patchStage('ENCOUNTER', 'context', act => {
                    act.input = { ...(act.input ?? {}), scenario: o.professional!.scenario }
                })
            }
            break
        case ExperienceType.MISSION:
            if (o.mission) {
                base.missionMeta = {
                    scenario: o.mission.scenario,
                    acceptableResponses: o.mission.acceptableResponses,
                    unexpectedEvent: o.mission.unexpectedEvent ?? null,
                }
            }
            break
    }
    return base
}

// ─────────────────────────── main ───────────────────────────

async function main() {
    console.log("ECLA — seeding competency sub-lessons (merged v1.0)...\n");

    const competencies = await prisma.competency.findMany({
        where: { level: "PRE_A1" },
        include: {
            realizations: { include: { language: true }, where: { language: { code: "es" } } },
            vocabulary: { include: { vocabulary: true } },
        },
        orderBy: [{ unitId: "asc" }, { orderIndex: "asc" }],
    });

    if (competencies.length === 0) {
        throw new Error("No PRE_A1 competencies found. Run seed.ts first, then seedSublessons.ts.");
    }

    // ── Content overrides: validate BEFORE merging (Art. 23 gate) ──
    const knownCodes = new Set(competencies.map(c => String(c.code).trim()))
    const report = validatePhases(phases, knownCodes)
    if (!report.passed) {
        throw new Error(`Content validation failed:\n- ${report.errors.join('\n- ')}`)
    }
    if (report.warnings.length) {
        console.warn(`Content warnings (${report.warnings.length}):\n- ${report.warnings.slice(0, 10).join('\n- ')}`)
    }
    const CONTENT = new Map<string, CompetencyContent>()
    for (const phase of phases) for (const c of phase.competencies) CONTENT.set(c.code, c)

    const types: ExperienceType[] = [
        ExperienceType.STORY,
        ExperienceType.DRILL,
        ExperienceType.IMMERSION,
        ExperienceType.PROFESSIONAL,
        ExperienceType.MISSION,
    ];

    let experiences = 0;
    let missions = 0;

    for (const competency of competencies) {
        const realization = competency.realizations[0];
        if (!realization) throw new Error(`Missing Spanish realization for ${competency.code}`);

        const vocabulary = competency.vocabulary.map((link: any) => link.vocabulary);
        const target = targetFromCompetency(competency, realization, vocabulary);
        console.log(`\n${competency.code} — ${competency.title}`);

        for (let index = 0; index < types.length; index++) {
            const type = types[index];
            const override = CONTENT.get(String(competency.code).trim());
            const content = applyOverride(buildExperienceContent(competency, target, type), override, type, target);

            // ID aligned with seed.ts → upsert OVERWRITES, never duplicates
            const id = `${competency.id}-${type.toLowerCase()}`;
            const isMission = type === ExperienceType.MISSION;

            await withRetry(() => prisma.learningExperience.upsert({
                where: { id },
                update: {
                    competencyId: competency.id,
                    title: `${competency.title} — ${type}`,
                    description: competency.canDo,
                    orderIndex: index + 1,
                    content: content as Prisma.InputJsonValue,
                    assessment: assessmentFor(competency, target) as Prisma.InputJsonValue,
                    estimatedMinutes: isMission ? 8 : type === ExperienceType.DRILL ? 6 : 7,
                },
                create: {
                    id,
                    competencyId: competency.id,
                    type,
                    title: `${competency.title} — ${type}`,
                    description: competency.canDo,
                    orderIndex: index + 1,
                    content: content as Prisma.InputJsonValue,
                    assessment: assessmentFor(competency, target) as Prisma.InputJsonValue,
                    estimatedMinutes: isMission ? 8 : type === ExperienceType.DRILL ? 6 : 7,
                },
            }));
            experiences++;
            console.log(`   ✓ ${type} (${STAGES.length} sub-lessons)`);

            if (isMission) {
                // Stable ID converging with seed.ts gateway missions
                const missionId = `${competency.id}-gateway`;
                await withRetry(() => prisma.mission.upsert({
                    where: { id: missionId },
                    update: {
                        competencyId: competency.id,
                        title: `${competency.title} — Mission`,
                        objective: competency.canDo,
                        scenario: `Complete a realistic situation in which you need to ${competency.canDo.toLowerCase()}.`,
                        difficulty: competency.difficulty,
                        successCriteria: {
                            version: VERSION,
                            function: ["communicates_intended_meaning", "responds_appropriately", "completes_task"],
                            form: ["target_language_used", "intelligible"],
                            transfer: true,
                            exactWordingRequired: false,
                        } as Prisma.InputJsonValue,
                        configuration: {
                            mode: "AI_ROLEPLAY",
                            support: "minimal",
                            allowEquivalentPhrasing: true,
                            deliberateVariation: true,
                            evaluateFormAndFunctionSeparately: true,
                        } as Prisma.InputJsonValue,
                    },
                    create: {
                        id: missionId,
                        competencyId: competency.id,
                        title: `${competency.title} — Mission`,
                        objective: competency.canDo,
                        scenario: `Complete a realistic situation in which you need to ${competency.canDo.toLowerCase()}.`,
                        difficulty: competency.difficulty,
                        successCriteria: {
                            version: VERSION,
                            function: ["communicates_intended_meaning", "responds_appropriately", "completes_task"],
                            form: ["target_language_used", "intelligible"],
                            transfer: true,
                            exactWordingRequired: false,
                        } as Prisma.InputJsonValue,
                        configuration: {
                            mode: "AI_ROLEPLAY",
                            support: "minimal",
                            allowEquivalentPhrasing: true,
                            deliberateVariation: true,
                            evaluateFormAndFunctionSeparately: true,
                        } as Prisma.InputJsonValue,
                    },
                }));

                if (override?.mission) {
                    await withRetry(() => prisma.mission.update({
                        where: { id: missionId },
                        data: {
                            scenario: override.mission.scenario,
                            successCriteria: {
                                version: VERSION,
                                function: override.mission.successCriteria,
                                form: ['target_language_used', 'intelligible'],
                                transfer: true,
                                exactWordingRequired: false,
                                acceptableResponses: override.mission.acceptableResponses,
                            } as Prisma.InputJsonValue,
                            configuration: {
                                mode: 'AI_ROLEPLAY',
                                support: 'minimal',
                                allowEquivalentPhrasing: true,
                                deliberateVariation: true,
                                unexpectedEvent: override.mission.unexpectedEvent ?? null,
                                evaluateFormAndFunctionSeparately: true,
                            } as Prisma.InputJsonValue,
                        },
                    }))
                }
                missions++;
            }
        }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ECLA sub-lesson seed complete");
    console.log(`   Competencies: ${competencies.length}`);
    console.log(`   Experiences:  ${experiences}`);
    console.log(`   Sub-lessons:  ${experiences * STAGES.length}`);
    console.log(`   Missions:     ${missions}`);
    console.log(`   Schema:       ${VERSION}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
    .catch((error) => {
        console.error("ECLA sub-lesson seed failed:");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });