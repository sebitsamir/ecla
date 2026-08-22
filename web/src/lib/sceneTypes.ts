/**
 * ECLA Scene Engine — shared type contracts.
 *
 * A SceneSpec is the "world" description a lesson plays:
 * where it happens, who is there, and the ordered beats the learner
 * moves through. Beats map onto the 9-stage ECLA ladder so the
 * Journey rail and the learner model stay in sync with the story.
 *
 * These types are consumed by the hooks and components in Phase 7
 * and, later, by seed-generated scene content (Phase 13 pipeline).
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

export type SceneOption = { label: string; correct?: boolean }

/**
 * One moment in a scene. Kinds:
 * - action:         narrator stage direction (auto-advances)
 * - say:            NPC speaks (auto TTS, then advances)
 * - listen:         NPC line the learner must actively tap to hear
 * - transfer-intro: "Same ability. New situation." — swaps the setting
 * - choice:         meaning-discovery / recognition options
 * - speak:          mic-first production; graded by useGrader
 */
export type SceneBeat =
    | { kind: 'action'; text: string; stage?: StageName }
    | { kind: 'say'; character: CharacterId; es: string; en?: string; stage?: StageName }
    | { kind: 'listen'; character: CharacterId; es: string; stage?: StageName }
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
        stage?: StageName
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
}