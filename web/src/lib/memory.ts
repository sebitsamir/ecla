/**
 * Learner memory — the system knows who it is talking to.
 *
 * Name sources, in priority order:
 *   1. A name the learner gave in-scene ("Me llamo …" / "Soy …"), captured
 *      by speak beats with `captureName: true` — learner agency wins.
 *   2. The account profile's first name, seeded once on first visit.
 *
 * Storage: localStorage for now. Server sync arrives with the retention
 * phase (Option 4) — the interface below is already shaped for it.
 */
const KEY = 'ecla.learner.name'

/** Sanitize a raw name: letters/spaces/hyphens, capped, title-cased. */
const clean = (raw: string): string => {
    const s = raw.replace(/[^\p{L}\s-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24)
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export function getLearnerName(): string | null {
    if (typeof window === 'undefined') return null
    const v = window.localStorage.getItem(KEY)
    return v && v.trim() ? v.trim() : null
}

export function setLearnerName(name: string): void {
    if (typeof window === 'undefined') return
    const v = clean(name)
    if (v) window.localStorage.setItem(KEY, v)
}

/** Seed from the auth profile — never overwrites a learner-given name. */
export function seedNameFromProfile(first?: string | null): void {
    if (getLearnerName()) return
    if (first?.trim()) setLearnerName(first)
}

/** Words that must never be mistaken for a name ("Soy estudiante"). */
const NOT_NAMES = new Set([
    'estudiante', 'profesor', 'profesora', 'sofia', 'marta',
    'daniel', 'luis', 'ana', 'yo', 'i',
])

const valid = (n: string) => n.length > 1 && !NOT_NAMES.has(n.toLowerCase())

/**
 * Extract a name from production attempts:
 *   "Me llamo Samir." → Samir · "Soy Samir." → Samir
 *   "Soy de Juba." → null · "Soy estudiante." → null
 */
export function parseLearnerName(text: string): string | null {
    const t = text.trim().replace(/[.!?¡¿]/g, '').trim()
    const meLlamo = /me llamo\s+([a-záéíóúüñ\- ]+)$/i.exec(t)
    if (meLlamo) {
        const n = clean(meLlamo[1])
        return valid(n) ? n : null
    }
    const soy = /^soy\s+(?!de\b)([a-záéíóúüñ\- ]+)$/i.exec(t)
    if (soy) {
        const n = clean(soy[1])
        return valid(n) ? n : null
    }
    return null
}

/** Remember a name captured in-scene. */
export function recordEncounter(name: string): void {
    setLearnerName(name)
}