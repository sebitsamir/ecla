/**
 * modeStages — Phase 12: each mode emphasizes different cognitive work.
 * Same competency, different stage focus — not just a different skin.
 */
import type { StageName } from '@/lib/sceneTypes'
import { STAGE_ORDER } from '@/lib/lessonPayload'
import type { EnginePayload } from '@/lib/lessonPayload'

export type ExperienceMode = 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL' | 'MISSION'

export const MODE_LABELS: Record<ExperienceMode, string> = {
    STORY: 'Story',
    DRILL: 'Drill',
    IMMERSION: 'Immersion',
    PROFESSIONAL: 'Professional',
    MISSION: 'Mission',
}

export const MODE_PURPOSE: Record<ExperienceMode, string> = {
    STORY: 'comprehension · context · meaning',
    DRILL: 'retrieval · automaticity · speed',
    IMMERSION: 'spontaneous interaction · natural language',
    PROFESSIONAL: 'purposeful application · clear register',
    MISSION: 'transfer · real-world proof',
}

/** Which 9-stage beats each mode foregrounds. */
export const MODE_STAGE_FOCUS: Record<string, StageName[]> = {
    STORY: [...STAGE_ORDER],
    DRILL: ['ENCOUNTER', 'RECOGNIZE', 'RETRIEVE', 'RETAIN'],
    IMMERSION: ['ENCOUNTER', 'UNDERSTAND', 'INTERACT', 'TRANSFER', 'RETAIN'],
    PROFESSIONAL: ['ENCOUNTER', 'NOTICE', 'PRODUCE', 'TRANSFER', 'RETAIN'],
    MISSION: ['INTERACT', 'TRANSFER', 'RETAIN'],
}

export function normalizeMode(raw?: string | null): ExperienceMode {
    const m = String(raw ?? 'STORY').toUpperCase()
    if (m in MODE_STAGE_FOCUS) return m as ExperienceMode
    return 'STORY'
}

export function filterEngineForMode(engine: EnginePayload, mode: string): EnginePayload {
    const focus = MODE_STAGE_FOCUS[mode] ?? MODE_STAGE_FOCUS.STORY
    const allowed = new Set(focus)
    const subLessons = engine.subLessons.filter(s => allowed.has(s.stage))
    if (!subLessons.length) return engine
    return { ...engine, subLessons }
}
