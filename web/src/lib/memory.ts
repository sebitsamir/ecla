/**
 * Learner memory — client helpers for the "living world" (Phase 9).
 * Characters remember the learner; the learner's own name is captured
 * from speech ("Me llamo …"), never from a form.
 * Memory is enhancement, never a blocker: every helper fails soft.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

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

/** Load name + encounter history. Null on failure → scene plays un-personalized. */
export async function fetchMemory(getToken: () => Promise<string | null>): Promise<LearnerMemory | null> {
    try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/v1/learner/memory`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

/** Record that the learner met a character (and optionally save their name). */
export async function recordEncounter(
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

/** Words that can never be a name ("Soy estudiante" ≠ a name). */
const BLOCKED = new Set([
    'estudiante', 'profesor', 'profesora', 'médico', 'medico',
    'amigo', 'amiga', 'yo', 'el', 'la', 'un', 'una', 'de',
])

/**
 * Extract the learner's name from a successful "say your name" utterance.
 * "Me llamo Samir." → "Samir" · "Soy Samir." → "Samir" · "Soy de Juba." → null
 */
export function parseLearnerName(text: string): string | null {
    const t = text.trim()
    let m = t.match(/me llamo\s+([a-záéíóúñü][a-záéíóúñü'\- ]{1,30})/i)
    if (!m) m = t.match(/\bsoy\s+(?!de\b)([a-záéíóúñü][a-záéíóúñü'\-]{1,20})/i)
    if (!m) return null

    const name = m[1].replace(/[.,!?;:].*$/, '').trim()
    if (name.length < 2 || BLOCKED.has(name.toLowerCase())) return null
    return name.charAt(0).toUpperCase() + name.slice(1)
}

