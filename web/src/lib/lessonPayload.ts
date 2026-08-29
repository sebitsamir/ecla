/**
 * lessonPayload — typed boundary for the DB 9-stage engine payload (Phase 5).
 *
 * The database (seedSublessons.ts) stores a richer pedagogical engine than
 * the player historically consumed. This module is the SINGLE normalization
 * point that turns that raw JSON into typed StagePayload[], so no shape
 * guessing happens anywhere downstream.
 */
import type { StageName } from '@/lib/sceneTypes'

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
    input?: any
    expectedOutput?: any
    evaluation?: any
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
    languageTargets: Record<string, unknown>
    subLessons: StagePayload[]
    assessment?: any
    modePurpose?: string
}

/** Pull the engine payload for a given experience mode, shape-defensively. */
export function extractEngine(lesson: any, mode: string = 'STORY'): EnginePayload | null {
    const exps = Array.isArray(lesson?.subLessons) ? lesson.subLessons : []
    const preferred = exps.find((e: any) => e?.type === mode)
    const story = exps.find((e: any) => e?.type === 'STORY') ?? exps[0]
    const exp = preferred ?? story
    const content = exp?.content ?? exp
    const rawStages: any[] = Array.isArray(content?.subLessons) ? content.subLessons : []
    if (!rawStages.length) return null

    const subLessons: StagePayload[] = rawStages
        .map((s: any): StagePayload | null => {
            const stage = isStage(s?.stage) ? (s.stage as string).trim() as StageName : null
            if (!stage) return null
            const activities: StageActivity[] = (Array.isArray(s?.activities) ? s.activities : [])
                .map((a: any) => ({
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
    return {
        languageTargets: (content?.languageTargets ?? {}) as Record<string, unknown>,
        subLessons,
        assessment: content?.assessment ?? exp?.assessment ?? undefined,
        modePurpose: content?.modePurpose ?? undefined,
    }
}