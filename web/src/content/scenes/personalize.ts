/**
 * personalize — runtime name injection over compiled beats.
 *
 * Two mechanisms:
 *   1. Explicit token: any authored line may contain `{{name}}`
 *      (Unit 2 dialogue scripts will use this).
 *   2. Natural greeting: the FIRST NPC "Hola…" say-beat becomes
 *      "¡Hola, <Name>! …" — the rest of the line is preserved, so no
 *      teaching content is lost ("Hola buenos días." → "¡Hola, Samir! Buenos días.").
 *
 * Pure function: same input → same output; safe under Strict Mode.
 */
import type { SceneBeat } from '@/lib/sceneTypes'

const TOKEN = '{{name}}'
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function applyLearnerName(beats: SceneBeat[], name: string | null): SceneBeat[] {
    if (!name) return beats
    let greeted = false

    return beats.map(b => {
        if (b.kind !== 'say' && b.kind !== 'listen' && b.kind !== 'unexpected') return b

        let es = b.es
        let gloss = b.gloss

        if (es.includes(TOKEN)) {
            es = es.split(TOKEN).join(name)
            if (gloss) gloss = gloss.split(TOKEN).join(name)
        } else if (!greeted && b.kind === 'say' && b.character !== 'you' && /^¡?hola\b/i.test(es)) {
            greeted = true
            const rest = es.replace(/^¡?hola[\s,.]*/i, '').trim()
            es = `¡Hola, ${name}!` + (rest ? ` ${cap(rest)}` : '')
        } else {
            return b
        }

        return { ...b, es, gloss } as SceneBeat
    })
}