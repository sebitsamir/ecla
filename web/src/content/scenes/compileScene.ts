/**
 * compileScene — the curriculum→scene compiler (Layer 1 → Layer 2 → runtime).
 * Pulls language targets from the lesson payload (DB), merges the blueprint's
 * creative direction, runs the archetype, and validates (Art. 23 gate).
 */
import type { SceneSpec } from '@/lib/sceneTypes'
import type { SceneBlueprint } from '@/lib/blueprint'
import { ARCHETYPES, type Ctx, type Target } from './archetypes'

const norm = (s: string) => s.toLowerCase().replace(/[¡!.,¿?]/g, '').trim()

/** Language truth comes ONLY from the curriculum payload. */
export function targetFromLesson(lesson: any): Target {
    const story = (lesson?.subLessons ?? []).find((s: any) => s.type === 'STORY')
    const lt = story?.content?.languageTargets ?? {}
    const toolsWords = (lesson?.tools?.vocabulary ?? []).map((v: any) => ({
        word: String(v.word ?? ''), translation: v.translation ? String(v.translation) : undefined,
    }))
    return {
        words: toolsWords.length ? toolsWords : (lt.vocabulary ?? []).map((x: string) => ({ word: x })),
        patterns: lt.patterns ?? [],
        examples: lt.examples ?? [],
        grammar: lt.grammar ?? lesson?.tools?.grammar ?? undefined,
        pronunciation: lt.pronunciation ?? lesson?.tools?.pronunciation ?? undefined,
        culture: lt.culture ?? undefined,
    }
}

export function compileScene(bp: SceneBlueprint, lesson: any): SceneSpec {
    const t = targetFromLesson(lesson)
        const glossMap = new Map<string, string>((lesson?.tools?.vocabulary ?? []).map((v: any) => [norm(String(v.word)), String(v.translation)]))
    const ctx: Ctx = {
        bp, t,
        gloss: x => glossMap.get(norm(x)),
        main: bp.characters[0],
        other: bp.characters[1],
    }
    const gen = ARCHETYPES[bp.archetype]
    const beats = gen ? gen(ctx) : []

    return {
        id: bp.id,
        competencyCodes: [bp.competency],
        environment: bp.environment,
        setting: `Madrid · ${bp.environment === 'cafe' ? 'A small café' : 'The street'} · ${bp.timeOfDay === 'evening' ? '19:30' : '9:42'}`,
        title: bp.title,
        outcomes: [
            lesson?.canDo ?? bp.title,
            'recover when you don\u2019t understand',
            'use it with a new person',
        ],
        beats,
    }
}

/** Art. 23 gate for scenes: structural + pedagogical checks before play. */
export function validateBlueprint(bp: SceneBlueprint, lesson: any): string[] {
    const errs: string[] = []
    const t = targetFromLesson(lesson)
    if (!t.words.length && !t.examples.length) errs.push(`${bp.id}: no language targets in curriculum payload`)
    const spec = compileScene(bp, lesson)
    if (!spec.beats.length) errs.push(`${bp.id}: archetype produced no beats`)
    const stages = new Set(spec.beats.map(b => b.stage).filter(Boolean) as string[])
    for (const s of ['ENCOUNTER', 'NOTICE', 'RECOGNIZE', 'RETRIEVE', 'PRODUCE', 'TRANSFER', 'RETAIN'])
        if (!stages.has(s)) errs.push(`${bp.id}: missing stage ${s}`)
    if (!spec.beats.some(b => b.kind === 'speak')) errs.push(`${bp.id}: no production beat`)
    if (!spec.beats.some(b => b.kind === 'choice')) errs.push(`${bp.id}: no meaning check`)
    return errs
}