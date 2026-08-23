/**
 * personalizeScene — the "living world" transform (Phase 9).
 *
 * When a character has met the learner before AND we know the learner's
 * name, that character's first line becomes a reunion greeting and a quiet
 * narrator beat acknowledges the memory (lesson_player §7:
 * "characters should remember what happened").
 *
 * Pure function: scene + memory in → personalized scene out.
 */
import type { SceneBeat, SceneSpec } from '@/lib/sceneTypes'
import type { LearnerMemory } from '@/lib/memory'
import { CAST } from '@/content/cast'

export function personalizeScene(scene: SceneSpec, memory: LearnerMemory | null): SceneSpec {
    if (!memory?.name) return scene
    const met = new Map(memory.characters.map(c => [c.characterId, c]))

    const beats: SceneBeat[] = []
    let reunionDone = false

    for (const b of scene.beats) {
        if (
            !reunionDone &&
            b.kind === 'say' &&
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