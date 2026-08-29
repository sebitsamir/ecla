/**
 * ECLA Scene Engine — shared type contracts (Phase 6: first-class scene spec).
 *
 * A SceneSpec is the "world" description a lesson plays:
 * where it happens, who is there, why the learner is there,
 * what language the world offers, how support fades, how the world
 * pushes back, and what counts as evidence — plus the ordered beats.
 *
 * Phase 6 adds eight spec sections populated by the Lesson Compiler from
 * the curriculum (competency → realization → engine payload → assessment).
 * All sections are optional on SceneSpec so older consumers keep compiling.
 */

/** The reusable 9-stage acquisition ladder (spec §11). */
export const STAGE_NAMES = [
    'ENCOUNTER', 'UNDERSTAND', 'NOTICE', 'RECOGNIZE', 'RETRIEVE',
    'PRODUCE', 'INTERACT', 'TRANSFER', 'RETAIN',
] as const

export type StageName = (typeof STAGE_NAMES)[number]

/** Recurring cast — real people with reasons to talk to you. */
export type CharacterId = 'sofia' | 'marta' | 'daniel' | 'luis' | 'ana' | 'you'

/** Environments get distinct visual treatment (gradient + label). */
export type Environment = 'cafe' | 'street' | 'shop' | 'home' | 'hotel' | 'office'

/** Support ladder (§3.4) — measured, fadeable, never invisible. */
export type SupportLevel = 'maximum' | 'high' | 'medium' | 'low' | 'minimal'

export type SceneOption = { label: string; correct?: boolean }

/**
 * A harder follow-up spliced into the beat queue when the learner
 * nails the parent beat on the first clean try (Phase 8 branching).
 * useSceneEngine inserts it as a full `speak` beat right after the parent.
 */
export type ChallengeSpec = {
    /** The NPC who poses the challenge. */
    character: CharacterId
    /** The NPC's line — doubles as their repeat line during repair. */
    es: string
    prompt: string
    expected: string[]
    accept?: string[]
    hints?: string[]
    replyOnSuccess?: string
}

/**
 * One moment in a scene. Kinds:
 * action:         narrator stage direction (auto-advances)
 * say:            NPC speaks (auto TTS, then advances)
 * listen:         NPC line the learner must actively tap to hear
 * transfer-intro: "Same ability. New situation." — swaps the setting
 * choice:         meaning-discovery / recognition options
 * speak:          mic-first production; graded by useGrader
 * unexpected:     NPC speaks slightly beyond comfort (Phase 8);
 *                 responding OR repairing both count as evidence (Arts. 14/15)
 */
export type SceneBeat =
    | { kind: 'action'; text: string; stage?: StageName }
    | { kind: 'say'; character: CharacterId; es: string; en?: string; gloss?: string; stage?: StageName }
    | { kind: 'listen'; character: CharacterId; es: string; gloss?: string; stage?: StageName }
    | { kind: 'transfer-intro'; text: string; setting?: string; stage?: StageName }
    | { kind: 'choice'; prompt: string; coach?: string; stage?: StageName; options: SceneOption[] }
    | {
        kind: 'speak'
        prompt: string
        /** Acceptable targets; first entry is the canonical form shown in coach lines. */
        expected: string[]
        /** Extra tolerated variants (Phase-3 tolerant grading). */
        accept?: string[]
        /** Support-fading ladder (Art. 12): shown one level per failed attempt. */
        hints?: string[]
        /** Open-ended → functional judge decides meaning (Art. 16). */
        open?: boolean
        /** NPC's natural reply when the learner succeeds — the world reacts. */
        replyOnSuccess?: string
        /** What the NPC actually said that the learner is answering (Phase 8). */
        npcLine?: string
        /** First-try clean success → insert this harder follow-up (Phase 8 branching). */
        challenge?: ChallengeSpec
        stage?: StageName
        captureName?: boolean
    }
    | {
        kind: 'unexpected'
        character: CharacterId
        /** The NPC's line, slightly beyond the learner's comfort zone. */
        es: string
        /** Hidden gloss shown in the dock so the learner grasps the stakes. */
        gloss?: string
        /** Tolerated responses; falls back to the line itself when absent. */
        accept?: string[]
        stage?: StageName
    }

// ── Phase 6: first-class scene spec sections ─────────────────────────────

/** WORLD — where the scene lives. */
export type SceneWorld = {
    location: Environment
    atmosphere: string
    objects: string[]
    time: string
}

/** CHARACTERS — people, not mascots. */
export type SceneCharacterSpec = {
    id: CharacterId
    role: 'primary' | 'secondary' | 'learner'
    relationship: string
    register: string
}

/** PURPOSE — the learner's lived goal (curriculum truth, world stakes). */
export type ScenePurpose = {
    canDo: string
    goal: string
    stakes: string
}

/** TARGET LANGUAGE — what the world offers the learner. */
export type SceneTargetLanguage = {
    functions: string[]
    patterns: string[]
    vocabulary: { word: string; translation?: string }[]
    pronunciation?: string
    culture?: string
}

/** SUPPORT — measured, fadeable, never invisible (Art. 12). */
export type SceneSupportPolicy = {
    initial: SupportLevel
    ladder: SupportLevel[]
    translation: 'hidden_by_default' | 'on_request'
    hintSource: 'pattern' | 'keyword' | 'model'
    retryPolicy: 'repair_open' | 'model_after_three'
}

/** CHALLENGE — the world pushes back (Phase 8 + transfer design). */
export type SceneChallengeSpec = {
    misunderstanding: string
    variation: string
    unexpected: string
}

/** EVIDENCE — what counts as proof (from the assessment contract §6.4). */
export type SceneEvidenceRequirements = {
    minimumEvidence: string[]
    interactionRequired: boolean
    repairRequired: boolean
    intelligibilityRequired: boolean
    repeatedContextsRequired: boolean
    dimensions: ('comprehension' | 'retrieval' | 'production' | 'interaction' | 'transfer')[]
}

/** A complete, playable scene for one or more competencies. */
export type SceneSpec = {
    id: string
    competencyCodes: string[]
    environment: Environment
    /** Human line under the backdrop, e.g. "Madrid · A small café · 9:42". */
    setting: string
    title: string
    /** "You can now…" statements for the evidence end card (Art. 24). */
    outcomes: string[]
    beats: SceneBeat[]
    cast?: CharacterId[]
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
    mood?: 'warm' | 'calm' | 'busy' | 'quiet'
    // Phase 6 — first-class spec sections (compiler-populated, optional).
    world?: SceneWorld
    characters?: SceneCharacterSpec[]
    purpose?: ScenePurpose
    targetLanguage?: SceneTargetLanguage
    support?: SceneSupportPolicy
    challenge?: SceneChallengeSpec
    evidenceRequirements?: SceneEvidenceRequirements
}

/** Stage categories — drives layout decisions without string matching. */
export type StageCategory = 'receptive' | 'productive' | 'terminal'

/** Rich metadata per stage — the single source of truth for stage logic. */
export const STAGE_META: Record<StageName, {
    order: number
    category: StageCategory
    /** Does this stage show the InteractionDock? */
    interactive: boolean
    /** Should backdrop emphasize the scene (full-bleed) vs. the task? */
    immersive: boolean
}> = {
    ENCOUNTER:  { order: 0, category: 'receptive',  interactive: false, immersive: true },
    UNDERSTAND: { order: 1, category: 'receptive',  interactive: true,  immersive: false },
    NOTICE:     { order: 2, category: 'receptive',  interactive: true,  immersive: false },
    RECOGNIZE:  { order: 3, category: 'receptive',  interactive: true,  immersive: false },
    RETRIEVE:   { order: 4, category: 'productive', interactive: true,  immersive: false },
    PRODUCE:    { order: 5, category: 'productive', interactive: true,  immersive: false },
    INTERACT:   { order: 6, category: 'productive', interactive: true,  immersive: false },
    TRANSFER:   { order: 7, category: 'productive', interactive: true,  immersive: true },
    RETAIN:     { order: 8, category: 'terminal',   interactive: false, immersive: false },
}

export const stageMeta = (s?: StageName) => s ? STAGE_META[s] : undefined
export const isTerminal  = (s?: StageName) => stageMeta(s)?.category === 'terminal'
export const isImmersive = (s?: StageName) => !!stageMeta(s)?.immersive
export const isInteractive = (s?: StageName) => !!stageMeta(s)?.interactive