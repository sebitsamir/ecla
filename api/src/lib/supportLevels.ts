/**
 * Support levels — Phase 35: measurable scaffolding.
 */
export const SUPPORT_LEVELS = [
    { level: 0, name: 'none', label: 'No support' },
    { level: 1, name: 'listen', label: 'Listen again' },
    { level: 2, name: 'hint', label: 'Hint' },
    { level: 3, name: 'keyword', label: 'Keyword' },
    { level: 4, name: 'starter', label: 'Sentence starter' },
    { level: 5, name: 'model', label: 'Model answer' },
] as const

export type SupportLevel = (typeof SUPPORT_LEVELS)[number]['level']

export function supportFromCount(count: number): SupportLevel {
    return Math.min(5, Math.max(0, count)) as SupportLevel
}

export function independenceFromSupport(supportLevel: number, correct: boolean): number {
    if (!correct) return 0
    return Math.round(Math.max(0, 100 - supportLevel * 18))
}
