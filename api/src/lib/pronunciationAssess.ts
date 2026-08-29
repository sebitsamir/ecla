/**
 * pronunciationAssess — Phase 24: intelligibility scoring from transcript vs target.
 * Acoustic scoring can replace this later; for now we use normalized text distance.
 */
const norm = (s: string) =>
    s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[¡!.,¿?'"«»]/g, '')
        .trim()

/** Levenshtein ratio (0–1, higher = closer). */
function similarity(a: string, b: string): number {
    if (!a || !b) return 0
    if (a === b) return 1
    const m = a.length
    const n = b.length
    const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
    }
    const dist = dp[m][n]
    return 1 - dist / Math.max(m, n)
}

export type IntelligibilityResult = {
    intelligible: boolean
    score: number
    notes?: string
}

export function assessIntelligibility(transcript: string, target: string): IntelligibilityResult {
    const t = norm(transcript)
    const expected = norm(target)
    if (!t) return { intelligible: false, score: 0, notes: 'No speech detected' }
    if (!expected) return { intelligible: t.length >= 2, score: t.length >= 2 ? 60 : 0 }

    const ratio = similarity(t, expected)
    const contains = t.includes(expected) || expected.includes(t)
    const score = Math.round(Math.max(ratio, contains ? 0.75 : 0) * 100)
    const intelligible = score >= 55 || (t.length >= 3 && contains)

    return {
        intelligible,
        score,
        notes: intelligible
            ? 'Clear enough to understand'
            : 'Try again — focus on vowels and stress',
    }
}
