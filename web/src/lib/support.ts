/**
 * Support ladder — support-removal algorithm (§3.4), now evidence-aware.
 *
 * Base support comes from the mastery level; the most recent accuracy
 * (this competency first, else the learner's recent average) nudges it
 * one step toward more scaffolding (struggled) or less (nailed it).
 *
 * Difficulty stays INVISIBLE (master plan §15): the learner only
 * experiences more or fewer hints — never a "Difficulty: 3/5" label.
 */
export type Support = 'maximum' | 'high' | 'medium' | 'low' | 'minimal'

const ORDER: Support[] = ['maximum', 'high', 'medium', 'low', 'minimal']

/** Mastery level → baseline scaffolding. */
export const SUPPORT_BY_LEVEL: Record<string, Support> = {
    NOT_STARTED: 'maximum',
    EXPOSED: 'maximum',
    DEVELOPING: 'medium',
    CONTROLLED: 'low',
    TRANSFERRED: 'minimal',
    RETAINED: 'minimal',
}

export function recommendSupport(
    mastery?: { level?: string; comprehensionScore?: number | null } | null,
    recentAccuracy?: number | null,
): Support {
    const base = SUPPORT_BY_LEVEL[mastery?.level ?? 'NOT_STARTED'] ?? 'medium'
    // This competency's own last session wins; otherwise the learner's recent average.
    const acc = typeof mastery?.comprehensionScore === 'number'
        ? mastery.comprehensionScore
        : recentAccuracy ?? null
    if (acc === null) return base

    const i = ORDER.indexOf(base)
    if (acc < 60) return ORDER[Math.max(0, i - 1)]                    // struggled → more support
    if (acc > 85) return ORDER[Math.min(ORDER.length - 1, i + 1)]     // nailed it → lighter
    return base
}