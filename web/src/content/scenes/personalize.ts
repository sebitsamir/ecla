/**
 * personalize — runtime transforms over compiled beats (Phases 9 + A).
 *
 * applyLearnerName: injects the learner's name into greetings.
 * personalizeScene: reunion beats when a character has met the learner before.
 */
import type { SceneBeat, SceneSpec } from '@/lib/sceneTypes'
import type { LearnerMemory } from '@/lib/memory'
import { CAST } from '@/content/cast'

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

/** Reunion greetings when characters remember the learner (Phase 9). */
export function personalizeScene(scene: SceneSpec, memory: LearnerMemory | null): SceneSpec {
    if (!memory?.name) return scene
    const met = new Map(memory.characters.map(c => [c.characterId, c]))

    const beats: SceneBeat[] = []
    let reunionDone = false

    for (const b of scene.beats) {
        if (
            !reunionDone &&
            b.kind === 'say' &&
            b.character !== 'you' &&
            (met.get(b.character)?.encounters ?? 0) > 0
        ) {
            reunionDone = true
            const who = CAST[b.character].name
            beats.push({
                kind: 'action',
                stage: b.stage,
                text: `${who} looks up — and recognizes you.`,
            })
            beats.push({ ...b, es: `¡Hola, ${memory.name}! ¡Qué gusto verte!` })
            continue
        }
        beats.push(b)
    }

    return reunionDone ? { ...scene, beats } : scene
}
