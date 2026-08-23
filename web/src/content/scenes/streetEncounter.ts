/**
 * streetEncounter — spaced retrieval disguised as running into someone (§6.5).
 *
 * No lesson chrome, no hints, no announcement of the algorithm: a familiar
 * face greets you and waits. The learner retrieves what they learned before,
 * in the wild. "The system doesn't need to announce the algorithm."
 */
import type { SceneSpec } from '@/lib/sceneTypes'

/** Live local time so the world feels current ("Evening · 6:12"). */
function nowLabel(): string {
    const d = new Date()
    const h = d.getHours()
    const part = h < 12 ? 'Morning' : h < 19 ? 'Afternoon' : 'Evening'
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return `${part} · ${time}`
}

export function streetEncounter(opts: {
    name?: string | null
    canDo: string
    expected: string[]
    accept?: string[]
}): SceneSpec {
    const { name, canDo, expected, accept } = opts
    const greeting = name ? `¡Hola, ${name}!` : '¡Hola!'

    return {
        id: 'scene-encounter-street',
        competencyCodes: [],
        environment: 'street',
        setting: `Your street · ${nowLabel()}`,
        title: 'A familiar face',
        outcomes: ['use what you learned before — without preparation'],
        beats: [
            { kind: 'action', stage: 'RETRIEVE', text: "Someone jogs up beside you, smiling. It's Daniel." },
            { kind: 'say', stage: 'RETRIEVE', character: 'daniel', es: greeting },
            {
                kind: 'speak', stage: 'RETRIEVE',
                prompt: `He waits. Show him you can: ${canDo.toLowerCase()}`,
                npcLine: greeting,
                expected,
                accept,
                open: true,
                hints: [],          // retrieval = no support (Art. 12)
                replyOnSuccess: '¡Perfecto! Nos vemos. ¡Hasta luego!',
            },
            { kind: 'action', stage: 'RETAIN', text: 'He waves and runs on. No lesson. No hints. Just Spanish — and you handled it.' },
        ],
    }
}