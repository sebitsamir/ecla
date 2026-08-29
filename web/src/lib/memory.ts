/**
 * Learner memory — name + character encounter history (Phase 9).
 *
 * Name sources, in priority order:
 *   1. A name the learner gave in-scene ("Me llamo …" / "Soy …")
 *   2. The account profile / server displayName, seeded once on first visit
 *
 * Character encounters sync to the API so reunion greetings work across sessions.
 * Every helper fails soft — memory must never block a scene.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const KEY = 'ecla.learner.name'

export type CharacterMemory = {
    characterId: string
    encounters: number
    firstMetAt: string
    lastMetAt: string
}

export type LearnerMemory = {
    name: string | null
    characters: CharacterMemory[]
}

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

/** Load name + encounter history from the server. Null on failure. */
export async function fetchMemory(getToken: () => Promise<string | null>): Promise<LearnerMemory | null> {
    try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/v1/learner/memory`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return null
        const data = await res.json()
        // Server name seeds local cache when the learner hasn't named themselves yet.
        if (data?.name && !getLearnerName()) setLearnerName(data.name)
        return data
    } catch {
        return null
    }
}

/** Record that the learner met a character (and optionally save their name). */
export async function recordCharacterEncounter(
    getToken: () => Promise<string | null>,
    characterId: string,
    learnerName?: string | null,
): Promise<void> {
    try {
        const token = await getToken()
        await fetch(`${API_URL}/api/v1/learner/memory/encounter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ characterId, learnerName: learnerName ?? undefined }),
        })
    } catch {
        // Silent: memory must never break the scene.
    }
}

/** Words that must never be mistaken for a name ("Soy estudiante"). */
const NOT_NAMES = new Set([
    'estudiante', 'profesor', 'profesora', 'médico', 'medico',
    'amigo', 'amiga', 'sofia', 'sofía', 'marta', 'daniel', 'luis', 'ana',
    'yo', 'i', 'el', 'la', 'un', 'una', 'de',
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

/** Remember a name captured in-scene (local + server on next encounter sync). */
export function rememberLearnerName(name: string): void {
    setLearnerName(name)
}
