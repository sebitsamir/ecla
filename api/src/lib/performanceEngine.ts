/**
 * Performance engine — Phase 37: correct ≠ fluent.
 */
export type PerformanceSnapshot = {
    accuracy: number
    responseTimeMs: number | null
    supportLevel: number
    independence: number
    contextDiversity: number
    spontaneity: number
    repair: boolean
    retention: boolean
}

export function computePerformance(input: {
    correct: number
    total: number
    responseTimeMs?: number | null
    supportLevel?: number
    contexts?: number
    repairUsed?: boolean
    delayed?: boolean
}): PerformanceSnapshot {
    const accuracy = input.total ? Math.round((input.correct / input.total) * 100) : 0
    const supportLevel = input.supportLevel ?? 0
    const independence = Math.round(Math.max(0, 100 - supportLevel * 18))
    const speed = input.responseTimeMs == null
        ? 50
        : input.responseTimeMs <= 2000 ? 90 : input.responseTimeMs <= 5000 ? 70 : input.responseTimeMs <= 10000 ? 50 : 30
    const spontaneity = Math.round((independence + speed) / 2)

    return {
        accuracy,
        responseTimeMs: input.responseTimeMs ?? null,
        supportLevel,
        independence,
        contextDiversity: input.contexts ?? 0,
        spontaneity,
        repair: !!input.repairUsed,
        retention: !!input.delayed,
    }
}

export function mergePerformance(prev: PerformanceSnapshot | null, next: PerformanceSnapshot): PerformanceSnapshot {
    if (!prev) return next
    return {
        accuracy: Math.max(prev.accuracy, next.accuracy),
        responseTimeMs: next.responseTimeMs ?? prev.responseTimeMs,
        supportLevel: Math.max(prev.supportLevel, next.supportLevel),
        independence: Math.max(prev.independence, next.independence),
        contextDiversity: Math.max(prev.contextDiversity, next.contextDiversity),
        spontaneity: Math.max(prev.spontaneity, next.spontaneity),
        repair: prev.repair || next.repair,
        retention: prev.retention || next.retention,
    }
}
