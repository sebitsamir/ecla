/**
 * Mastery Engine — single authority for level promotion (ECLA consolidation).
 * No route should implement its own mastery ladder rules.
 */
import { MasteryLevel } from '@prisma/client'

const LEVEL_RANK: Record<MasteryLevel, number> = {
    NOT_STARTED: 0,
    EXPOSED: 1,
    DEVELOPING: 2,
    CONTROLLED: 3,
    TRANSFERRED: 4,
    RETAINED: 5,
}

export type MasteryEvaluationInput = {
    currentLevel: MasteryLevel
    comprehension: number | null
    production: number | null
    retrieval: number | null
    transfer: number | null
    contextsCount: number
    repairsCompleted: number
    delayed: boolean
}

/** Constitutional ladder — evidence-based promotion only. */
export function evaluateMasteryLevel(input: MasteryEvaluationInput): MasteryLevel {
    const {
        currentLevel,
        comprehension,
        production,
        retrieval,
        transfer,
        contextsCount,
        repairsCompleted,
        delayed,
    } = input

    const comp = comprehension ?? 0
    const prod = production ?? 0
    const retr = retrieval ?? 0
    const trans = transfer ?? 0

    let level = currentLevel

    if (level === 'TRANSFERRED' && delayed && retr >= 70) {
        return 'RETAINED'
    }

    if (
        LEVEL_RANK[level] >= LEVEL_RANK.CONTROLLED &&
        comp >= 70 &&
        prod >= 65 &&
        trans >= 60 &&
        contextsCount >= 2 &&
        repairsCompleted >= 1
    ) {
        level = 'TRANSFERRED'
    } else if (
        (level === 'NOT_STARTED' || level === 'EXPOSED' || level === 'DEVELOPING') &&
        comp >= 60 &&
        prod >= 50
    ) {
        level = 'CONTROLLED'
    } else if (level === 'NOT_STARTED' || level === 'EXPOSED') {
        level = 'DEVELOPING'
    }

    return level
}

/** Experience completion records engagement — never promotes to CONTROLLED or beyond. */
export function experienceEngagementLevel(
    currentLevel: MasteryLevel,
    engaged: boolean,
): MasteryLevel {
    if (!engaged) return currentLevel
    if (LEVEL_RANK[currentLevel] >= LEVEL_RANK.DEVELOPING) return currentLevel
    if (currentLevel === 'NOT_STARTED') return 'EXPOSED'
    return 'DEVELOPING'
}

export function bestScore(prev: number | null | undefined, next: number | null | undefined): number | null {
    if (next === null || next === undefined) return prev ?? null
    return Math.max(prev ?? 0, next)
}

export function blendScore(old: number | null | undefined, score: number): number {
    return old == null ? score : Math.round(old * 0.6 + score * 0.4)
}

export function overallFromDimensions(scores: Array<number | null | undefined>): number | null {
    const valid = scores.filter((s): s is number => s !== null && s !== undefined)
    return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
}

export function buildContextKey(parts: {
    sceneId?: string
    environmentId?: string
    characterId?: string
    contextId?: string
}): string | null {
    const segments = [
        parts.sceneId,
        parts.environmentId,
        parts.characterId,
    ].filter(Boolean)
    if (segments.length > 0) return segments.join(':')
    return parts.contextId ?? null
}

export function mergeContexts(existing: string[] | null | undefined, key: string | null): string[] {
    const contexts = (existing ?? []) as string[]
    if (!key || contexts.includes(key)) return contexts
    return [...contexts, key]
}
