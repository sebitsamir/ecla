import type { GoldenDimension, GoldenLevel } from '../../../packages/contracts/golden'
import type { GoldenDefinition } from './definition'
import { DAY_MS } from './definition'

export type ScoredResponse = { dimension: string | null; correct: boolean; supported: boolean; repair: boolean }
export type ObservedAttempt = {
    definition: GoldenDefinition
    reviewed: boolean
    contextNovel: boolean
    retentionEligible: boolean
    completedAt: Date
    responses: ScoredResponse[]
}
export const DIMENSIONS: GoldenDimension[] = ['comprehension', 'retrieval', 'production', 'interaction', 'transfer', 'retention']
export function passedAttempt(attempt: ObservedAttempt): boolean {
    const scored = attempt.responses.filter(response => response.dimension !== null)
    return scored.length > 0 && scored.every(response => response.correct && !response.supported)
}

/** Rebuild exclusively from server-owned evidence, never historical client scores. */
export function projectEvidence(history: ObservedAttempt[]) {
    const dimensions = Object.fromEntries(DIMENSIONS.map(key => [key, null])) as Record<GoldenDimension, number | null>
    const contexts = new Set<string>()
    let repairs = 0
    let transferred = false
    let retained = false
    let allReviewed = history.length > 0
    for (const attempt of history) {
        allReviewed &&= attempt.reviewed
        const passed = passedAttempt(attempt)
        for (const dimension of DIMENSIONS) {
            if (dimension === 'transfer' && (!attempt.contextNovel || attempt.definition.purpose !== 'transfer')) continue
            if (dimension === 'retention' && (!attempt.retentionEligible || attempt.definition.purpose !== 'retention')) continue
            const responses = attempt.responses.filter(response => response.dimension === dimension)
            if (!responses.length) continue
            const score = responses.reduce((sum, response) => sum + (response.correct ? (response.supported ? 50 : 100) : 0), 0) / responses.length
            dimensions[dimension] = dimensions[dimension] === null ? score : Math.round(dimensions[dimension]! * 0.6 + score * 0.4)
        }
        repairs += attempt.responses.filter(response => response.repair && response.correct && !response.supported).length
        if (passed && attempt.definition.purpose === 'practice') contexts.add(attempt.definition.contextFingerprint)
        if (passed && attempt.definition.purpose === 'transfer' && attempt.contextNovel && contexts.size >= 3 && repairs > 0) transferred = true
        if (passed && attempt.definition.purpose === 'retention' && attempt.retentionEligible && transferred) retained = true
        // A later failure invalidates the old highest-level claim until a new
        // successful transfer/retention observation replaces it.
        if (!passed) { transferred = false; retained = false }
    }
    let level: GoldenLevel = history.length ? 'DEVELOPING' : 'NOT_STARTED'
    if (contexts.size && (dimensions.comprehension ?? 0) >= 70 && (dimensions.production ?? 0) >= 65 && (dimensions.retrieval ?? 0) >= 70) level = 'CONTROLLED'
    if (transferred && (dimensions.transfer ?? 0) >= 70) level = 'TRANSFERRED'
    if (retained && (dimensions.retention ?? 0) >= 70 && (dimensions.retrieval ?? 0) >= 70) level = 'RETAINED'
    const last = history.at(-1)
    const nextReviewAt = last ? new Date(last.completedAt.getTime() + DAY_MS).toISOString() : null
    return { dimensions, level, allReviewed, contexts: [...contexts], repairs, nextReviewAt }
}

export function availability(definition: GoldenDefinition, history: ObservedAttempt[], now: Date): string | null {
    if (definition.purpose === 'practice') return null
    const practiced = new Set(history.filter(attempt => attempt.definition.purpose === 'practice' && passedAttempt(attempt)).map(attempt => attempt.definition.contextFingerprint))
    if (practiced.size < 3) return 'Complete the three practice contexts independently first.'
    if (definition.purpose === 'transfer') return null
    const projection = projectEvidence(history)
    if (projection.level !== 'TRANSFERRED' && projection.level !== 'RETAINED') return 'Complete a new-context transfer successfully before a retention check.'
    const last = history.at(-1)
    if (!last || now.getTime() - last.completedAt.getTime() < DAY_MS) return `Retention opens ${projection.nextReviewAt}; it requires a full day without another completed greeting practice.`
    return null
}
