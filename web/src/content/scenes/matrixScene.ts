/**
 * matrixScene — Phase 7: every Pre-A1 competency gets a curriculum-driven scene.
 *
 * Synthesizes a SceneBlueprint from the authored direction table and defers all
 * language/stage/evidence content to the Lesson Compiler (compileScene), which
 * reads the DB engine payload. Authored blueprints (Unit 1) still win — the
 * matrix is the fallback layer, so nothing dead-ends and nothing is random.
 */
import type { SceneBlueprint } from '@/lib/blueprint'
import type { SceneSpec } from '@/lib/sceneTypes'
import { extractEngine } from '@/lib/lessonPayload'
import { compileScene } from './compileScene'
import { directionFor, type UnitDirection } from './unitDirections'

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function matrixSceneFor(code: string, lesson: any, mode?: string): SceneSpec | undefined {
    if (!extractEngine(lesson, mode ?? 'STORY')) return undefined

    const dir = directionFor(code)
    const canDo = String(lesson?.canDo ?? code)

    const bp = {
        id: `mx-${String(code).toLowerCase()}`,
        competency: code,
        archetype: 'matrix',                 // unknown key → pure engine beats
        environment: dir.environment,
        characters: dir.cast,
        timeOfDay: dir.timeOfDay,
        mood: dir.mood,
        title: cap(canDo),
        transferSetting: dir.transferSetting,
        retain: `Later today, the same person needs it again — after delay.`,
    } as unknown as SceneBlueprint

    return compileScene(bp, lesson, mode)
}

/**
 * The full 15-field scene matrix record (Phase 8 table, as data).
 * Used by validation (Phase 18) and future authoring tooling.
 */
export function sceneMatrixEntry(code: string, lesson: any) {
    const dir: UnitDirection = directionFor(code)
    const eng = extractEngine(lesson)
    const acts = (stage: string, type: string) =>
        eng?.subLessons.find(s => s.stage === stage)?.activities.find(a => a.type === type)
    const assessment = (eng?.assessment ?? {}) as any

    return {
        sceneId: `mx-${String(code).toLowerCase()}`,
        unit: dir.key,
        competency: code,
        canDo: String(lesson?.canDo ?? code),
        context: `${dir.environment} · ${dir.timeOfDay} · ${dir.mood}`,
        characters: dir.cast,
        targetLanguage: {
            patterns: ((eng?.languageTargets as any)?.patterns ?? []).slice(0, 6),
            vocabulary: ((eng?.languageTargets as any)?.vocabulary ?? []).slice(0, 8),
        },
        input: (acts('ENCOUNTER', 'listening')?.input as any)?.utterances ?? [],
        production: acts('PRODUCE', 'guided_speaking')?.prompt ?? null,
        interaction: (acts('INTERACT', 'guided_interaction')?.input as any)?.opening ?? null,
        unexpected: dir.unexpected,
        transfer: acts('TRANSFER', 'simulation')?.prompt ?? null,
        evidence: assessment?.mastery ?? null,
        support: eng?.subLessons.map(s => `${s.stage}:${s.support}`) ?? [],
        revisit: assessment?.retention?.scheduleDays ?? [1, 2, 4, 7, 14, 30],
    }
}