/**
 * ECLA Grading Engine — FORM LAYER (client-side, zero network)
 *
 * Constitution Arts. 11/16/18: errors are data, no artificial difficulty,
 * assessment resembles reality. Resolution order (cheap → expensive):
 *   1. exact (normalized)      — free
 *   2. accept[] variants       — free
 *   3. bounded typo tolerance  — free (Levenshtein with early exit)
 *   4. AI functional judge     — server call, ONLY for open typed answers
 *
 * 95%+ of answers resolve locally; the judge fires rarely.
 */

export type GradeResult =
    | { correct: boolean; method: 'exact' | 'normalized' | 'variant' | 'fuzzy'; needsJudge?: false }
    | { correct: false; method: null; needsJudge: true }

/** Lowercase, strip accents + punctuation, collapse spaces. */
export function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // accents
        .replace(/[¿¡?!.,;:()"']/g, '')      // punctuation
        .replace(/\s+/g, ' ')
        .trim()
}

/** Bounded Levenshtein with early exit — never computes beyond `max`. */
export function levenshtein(a: string, b: string, max: number): number {
    if (a === b) return 0
    const la = a.length, lb = b.length
    if (Math.abs(la - lb) > max) return max + 1
    let prev = Array.from({ length: lb + 1 }, (_, j) => j)
    for (let i = 1; i <= la; i++) {
        const cur = [i, ...new Array(lb).fill(0)]
        let rowMin = cur[0]
        for (let j = 1; j <= lb; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
            rowMin = Math.min(rowMin, cur[j])
        }
        if (rowMin > max) return max + 1
        prev = cur
    }
    return prev[lb]
}

// Typos allowed by answer length: short answers must be exact (no fake passes)
const budget = (len: number) => (len >= 8 ? 2 : len >= 4 ? 1 : 0)

/**
 * Grade an answer locally.
 * Returns needsJudge only for open typed types where the learner wrote
 * something plausible but non-matching — meaning may still be right.
 */
export function gradeLocal(
    rawAnswer: string,
    ex: { type: string; answer?: string; accept?: string[] },
): GradeResult {
    const a = normalize(rawAnswer)
    if (!a) return { correct: false, method: 'exact' }

    const targets = [ex.answer, ...(ex.accept ?? [])].filter(Boolean) as string[]

    // 1) exact after normalization
    if (targets.some(t => normalize(t) === a)) {
        return { correct: true, method: normalize(ex.answer ?? '') === a ? 'normalized' : 'variant' }
    }

    // 2) typo tolerance (form only)
    for (const t of targets) {
        const n = normalize(t)
        const b = budget(n.length)
        if (b > 0 && levenshtein(a, n, b) <= b) return { correct: true, method: 'fuzzy' }
    }

    // 3) open answers → let the functional judge decide meaning
    const openTypes = ['fill_blank', 'translate', 'listen_type', 'recall']
    if (openTypes.includes(ex.type) && a.length >= 3) {
        return { correct: false, method: null, needsJudge: true }
    }

    return { correct: false, method: 'exact' }
}