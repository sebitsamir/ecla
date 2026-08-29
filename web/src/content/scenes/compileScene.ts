/**
 * compileScene — curriculum→scene compiler (Phase 5: DB-driven).
 *
 * Pipeline (constitution order):
 *   Database engine payload (9 stages) → typed normalization (lessonPayload)
 *   → activityRegistry beat builders → archetype fallback for missing stages
 *   → empty-beat defense → runtime personalization.
 */
import type { SceneBeat, SceneSpec, StageName } from '@/lib/sceneTypes'
import { STAGE_META, STAGE_NAMES } from '@/lib/sceneTypes'
import type { SceneBlueprint } from '@/lib/blueprint'
import { ARCHETYPES, type Ctx, type Target } from './archetypes'
import { getLearnerName } from '@/lib/memory'
import { applyLearnerName } from './personalize'
import { extractEngine } from '@/lib/lessonPayload'
import { buildSceneSpecSections } from '@/lib/sceneSpec'
import { filterEngineForMode, normalizeMode } from '@/lib/modeStages'
import { activityToBeats } from '@/lib/activityRegistry'

const norm = (s: string) => s.toLowerCase().replace(/[¡!.,¿?]/g, '').trim()

/** Language truth comes ONLY from the curriculum payload. */
export function targetFromLesson(lesson: any, mode: string = 'STORY'): Target {
    const exps = lesson?.subLessons ?? []
    const exp = exps.find((s: any) => s.type === mode) ?? exps.find((s: any) => s.type === 'STORY')
    const story = exp ?? exps[0]
    const lt = story?.content?.languageTargets ?? story?.languageTargets ?? {}
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

function beatsForStage(bp: SceneBlueprint, ctx: Ctx, st: import('@/lib/lessonPayload').StagePayload, t: Target): SceneBeat[] {
    const built: SceneBeat[] = []
    for (const act of st.activities) {
        built.push(...activityToBeats(act, ctx, st, t))
    }
    // RETAIN terminal narration when no activities mapped
    if (st.stage === 'RETAIN' && !built.length) {
        built.push({ kind: 'action', text: bp.retain || st.objective, stage: 'RETAIN' })
    }
    // TRANSFER intro when simulation beats exist
    if (st.stage === 'TRANSFER' && built.some(b => b.kind === 'speak' || b.kind === 'unexpected')) {
        built.unshift({
            kind: 'transfer-intro',
            text: 'Same ability. New situation.',
            setting: bp.transferSetting,
            stage: 'TRANSFER',
        })
    }
    return built
}

export function compileScene(bp: SceneBlueprint, lesson: any, mode?: string): SceneSpec {
    const activeMode = normalizeMode(mode)
    const t = targetFromLesson(lesson, activeMode)
    if (process.env.NODE_ENV !== 'production' && !t.words.length && !t.examples.length) {
        console.warn(`[ecla] compileScene(${bp.id}): EMPTY curriculum payload — page must pass lesson to sceneFor().`)
    }
    const glossMap = new Map<string, string>((lesson?.tools?.vocabulary ?? []).map((v: any) => [norm(String(v.word)), String(v.translation)]))
    const ctx: Ctx = {
        bp, t,
        gloss: x => glossMap.get(norm(x)),
        main: bp.characters[0],
        other: bp.characters[1],
    }

    const gen = ARCHETYPES[bp.archetype]
    const archetypeBeats = gen ? gen(ctx) : []
    let engine = extractEngine(lesson, activeMode)
    if (engine && activeMode !== 'STORY') {
        engine = filterEngineForMode(engine, activeMode)
    }

    let beats: SceneBeat[]
    if (engine) {
        const covered = new Set<StageName>()
        const built: SceneBeat[] = []
        for (const st of [...engine.subLessons].sort((a, b) => a.order - b.order)) {
            const sb = beatsForStage(bp, ctx, st, t)
            if (sb.length) { covered.add(st.stage); built.push(...sb) }
        }
        for (const stage of STAGE_NAMES) {
            if (covered.has(stage)) continue
            const fb = archetypeBeats.filter(b => b.stage === stage)
            if (fb.length) built.push(...fb)
            if (process.env.NODE_ENV !== 'production' && !fb.length) {
                console.warn(`[ecla] ${bp.id}: stage ${stage} has no engine or archetype beats`)
            }
        }
        beats = built.sort((a, b) =>
            STAGE_META[a.stage ?? 'ENCOUNTER'].order - STAGE_META[b.stage ?? 'ENCOUNTER'].order)
    } else {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[ecla] ${bp.id}: no engine payload — archetype-only compile`)
        }
        beats = archetypeBeats
    }

    beats = beats.filter(b => {
        if ((b.kind === 'say' || b.kind === 'listen') && !(b as any).es?.trim()) return false
        if (b.kind === 'choice' && !b.options.some(o => o.label?.trim())) return false
        if (b.kind === 'read' && !b.passage?.trim()) return false
        return true
    })

    beats = applyLearnerName(beats, getLearnerName())

    const specSections = buildSceneSpecSections(bp, lesson)
    const world = specSections.world
    const envLabel = world
        ? (world.location === 'cafe' ? 'A small café' : world.location.charAt(0).toUpperCase() + world.location.slice(1))
        : (bp.environment === 'cafe' ? 'A small café' : 'The street')

    return {
        id: bp.id,
        competencyCodes: [bp.competency],
        environment: bp.environment,
        setting: world
            ? `Madrid · ${envLabel} · ${world.time}`
            : `Madrid · ${envLabel} · ${bp.timeOfDay === 'evening' ? '19:30' : '9:42'}`,
        title: bp.title,
        timeOfDay: bp.timeOfDay,
        mood: bp.mood,
        cast: bp.characters,
        outcomes: [
            lesson?.canDo ?? bp.title,
            'recover when you don\u2019t understand',
            'use it with a new person',
        ],
        beats,
        ...specSections,
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
    for (const s of STAGE_NAMES)
        if (!stages.has(s)) errs.push(`${bp.id}: missing stage ${s}`)
    if (!spec.beats.some(b => b.kind === 'speak' || b.kind === 'write')) errs.push(`${bp.id}: no production beat`)
    if (!spec.beats.some(b => b.kind === 'choice' || b.kind === 'read')) errs.push(`${bp.id}: no meaning check`)
    return errs
}
