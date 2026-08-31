/**
 * lessonPayload — typed boundary for the DB 9-stage engine payload (Phase 5).
 *
 * The database (seedSublessons.ts) stores a richer pedagogical engine than
 * the player historically consumed. This module is the SINGLE normalization
 * point that turns that raw JSON into typed StagePayload[], so no shape
 * guessing happens anywhere downstream.
 */
import type { StageName } from '@/lib/sceneTypes'
import { record, strings } from './jsonBoundary'
import type { ToolsData, MasteryData } from '@/components/ecla/ToolsPanel'

export type LessonPayload = {
    code: string
    conceptId: string
    canDo: string
    tools?: ToolsData
    mastery?: MasteryData | null
    subLessons: {
        id: string
        type: string
        content?: Record<string, unknown> & { modePurpose?: string }
        assessment?: unknown
    }[]
}

export const STAGE_ORDER = [
    'ENCOUNTER', 'UNDERSTAND', 'NOTICE', 'RECOGNIZE', 'RETRIEVE',
    'PRODUCE', 'INTERACT', 'TRANSFER', 'RETAIN',
] as const

/** Trim-tolerant: seed history carried stray whitespace on stage keys. */
export const isStage = (s: unknown): s is StageName =>
    typeof s === 'string' && (STAGE_ORDER as readonly string[]).includes(s.trim())

export type StageActivity = {
    id: string
    stage: StageName
    type: string
    title: string
    purpose: string
    prompt?: string
    input?: unknown
    expectedOutput?: unknown
    evaluation?: unknown
}

export type StagePayload = {
    id: string
    order: number
    stage: StageName
    title: string
    objective: string
    learnerAction: string
    support: string
    activities: StageActivity[]
}

export type EnginePayload = {
    languageTargets: {
        vocabulary: string[]; patterns: string[]; examples: string[]; chunks: string[]
        grammar?: string; pronunciation?: string; culture?: string
    }
    subLessons: StagePayload[]
    assessment?: unknown
    modePurpose?: string
}

/** Pull the engine payload for a given experience mode, shape-defensively. */
export function extractEngine(lesson: unknown, mode: string = 'STORY'): EnginePayload | null {
    const rawExperiences = record(lesson).subLessons
    const exps = Array.isArray(rawExperiences) ? rawExperiences.map(record) : []
    const preferred = exps.find(e => e.type === mode)
    const story = exps.find(e => e.type === 'STORY') ?? exps[0]
    const exp = preferred ?? story
    const content = record(exp?.content ?? exp)
    const rawStages: unknown[] = Array.isArray(content.subLessons) ? content.subLessons : []
    if (!rawStages.length) return null

    const subLessons: StagePayload[] = rawStages
        .map((raw): StagePayload | null => {
            const s = record(raw)
            const stage = isStage(s?.stage) ? (s.stage as string).trim() as StageName : null
            if (!stage) return null
            const activities: StageActivity[] = (Array.isArray(s?.activities) ? s.activities : [])
                .map(record).map(a => ({
                    id: String(a?.id ?? ''),
                    stage,
                    type: String(a?.type ?? ''),
                    title: String(a?.title ?? ''),
                    purpose: String(a?.purpose ?? ''),
                    prompt: typeof a?.prompt === 'string' ? a.prompt : undefined,
                    input: a?.input,
                    expectedOutput: a?.expectedOutput,
                    evaluation: a?.evaluation,
                }))
            return {
                id: String(s?.id ?? ''),
                order: Number(s?.order ?? 0),
                stage,
                title: String(s?.title ?? stage),
                objective: String(s?.objective ?? ''),
                learnerAction: String(s?.learnerAction ?? ''),
                support: String(s?.support ?? 'medium'),
                activities,
            }
        })
        .filter((x): x is StagePayload => x !== null)

    if (!subLessons.length) return null
    const targets = record(content.languageTargets)
    const text = (value: unknown) => typeof value === 'string' ? value : undefined
    return {
        languageTargets: {
            vocabulary: strings(targets.vocabulary), patterns: strings(targets.patterns),
            examples: strings(targets.examples), chunks: strings(targets.chunks),
            grammar: text(targets.grammar), pronunciation: text(targets.pronunciation), culture: text(targets.culture),
        },
        subLessons,
        assessment: content?.assessment ?? exp?.assessment ?? undefined,
        modePurpose: text(content.modePurpose),
    }
}
