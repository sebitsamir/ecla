/**
 * Transcript matching only. This cannot observe pronunciation or acoustics.
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

export type TranscriptionMatchResult = {
    kind: 'transcription_match'
    intelligible: boolean
    score: number
    notes?: string
}

export function assessTranscriptionMatch(transcript: string, target: string): TranscriptionMatchResult {
    const t = norm(transcript)
    const expected = norm(target)
    if (!t) return { kind: 'transcription_match', intelligible: false, score: 0, notes: 'No transcript returned' }
    if (!expected) return { kind: 'transcription_match', intelligible: t.length >= 2, score: t.length >= 2 ? 60 : 0, notes: 'Transcript present; no acoustic claim' }

    const ratio = similarity(t, expected)
    const contains = t.includes(expected) || expected.includes(t)
    const score = Math.round(Math.max(ratio, contains ? 0.75 : 0) * 100)
    const intelligible = score >= 55 || (t.length >= 3 && contains)

    return {
        kind: 'transcription_match',
        intelligible,
        score,
        notes: intelligible
            ? 'Transcript text matched the expected text; pronunciation was not assessed'
            : 'Transcript text did not match reliably; no pronunciation conclusion is available',
    }
}
