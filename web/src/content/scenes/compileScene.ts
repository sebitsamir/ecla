/**
 * compileScene — curriculum→scene compiler (Phase 5: DB-driven).
 *
 * Pipeline (constitution order):
 *   Database engine payload (9 stages) → typed normalization (lessonPayload)
 *   → per-stage beat builders → archetype fallback for missing stages
 *   → empty-beat defense → runtime personalization.
 *
 * Language text comes ONLY from the DB payload (realizations/vocabulary).
 * Blueprints keep creative direction only (cast, environment, mood, transfer).
 * Every scored beat carries its stage → evidence alignment is structural.
 */
import type { SceneBeat, SceneSpec, StageName } from '@/lib/sceneTypes'
import { STAGE_META, STAGE_NAMES } from '@/lib/sceneTypes'
import type { SceneBlueprint } from '@/lib/blueprint'
import { ARCHETYPES, type Ctx, type Target } from './archetypes'
import { getLearnerName } from '@/lib/memory'
import { applyLearnerName } from './personalize'
import { extractEngine, type StagePayload } from '@/lib/lessonPayload'

const norm = (s: string) => s.toLowerCase().replace(/[¡!.,¿?]/g, '').trim()
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const strs = (v: unknown): string[] =>
    Array.isArray(v)
        ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim())
        : []

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

// ── Per-stage beat builders: DB activity → player-native beat ──
function beatsForStage(bp: SceneBlueprint, ctx: Ctx, st: StagePayload, t: Target): SceneBeat[] {
    const main = ctx.main
    const other = (ctx.other ?? ctx.main) as typeof main
    const example = t.examples[0] ?? t.patterns[0] ?? ''
    const acts = st.activities
    const byType = (...types: string[]) => acts.find(a => types.includes(a.type))

    switch (st.stage) {
        case 'ENCOUNTER': {
            const beats: SceneBeat[] = []
            const ctxAct = byType('context')
            const scenario =
                str((ctxAct?.input as any)?.scenario) ?? str((ctxAct?.input as any)?.targetLanguage) ?? st.objective
            beats.push({ kind: 'action', text: scenario, stage: 'ENCOUNTER' })
            const utter = strs((byType('listening')?.input as any)?.utterances)
            const es = utter[0] ?? example
            if (es) beats.push({ kind: 'listen', character: main, es, gloss: ctx.gloss(es), stage: 'ENCOUNTER' })
            return beats
        }
        case 'UNDERSTAND': {
            const beats: SceneBeat[] = []
            if (example) beats.push({ kind: 'say', character: main, es: example, gloss: ctx.gloss(example), stage: 'UNDERSTAND' })
            const comp = acts.find(a => a.type === 'comprehension')
            let options = strs((comp?.input as any)?.options)
            const correct = str(comp?.expectedOutput) ?? options[0]
            if (correct && !options.includes(correct)) options = [correct, ...options]
            if (correct && options.length >= 2) {
                beats.push({
                    kind: 'choice',
                    prompt: str(comp?.prompt) ?? 'What is happening here?',
                    stage: 'UNDERSTAND',
                    options: options.slice(0, 4).map(o => ({ label: o, correct: o === correct })),
                })
            }
            return beats
        }
        case 'NOTICE': {
            const beats: SceneBeat[] = []
            const patterns = strs((byType('noticing')?.input as any)?.patterns).slice(0, 2)
            for (const p of patterns) beats.push({ kind: 'listen', character: main, es: p, gloss: ctx.gloss(p), stage: 'NOTICE' })
            const pron = byType('pronunciation')
            const pes = str((pron?.input as any)?.target) ?? example
            if (pes) beats.push({ kind: 'listen', character: main, es: pes, gloss: str((pron?.input as any)?.note) ?? undefined, stage: 'NOTICE' })
            return beats
        }
        case 'RECOGNIZE': {
            const rec = byType('recognition')
            let options = strs((rec?.input as any)?.options)
            const correct = str(rec?.expectedOutput) ?? example
            if (correct && !options.includes(correct)) options = [correct, ...options]
            if (!correct || options.length < 2) return []
            return [{
                kind: 'choice',
                prompt: str(rec?.prompt) ?? 'Which one helps you?',
                stage: 'RECOGNIZE',
                options: options.slice(0, 5).map(o => ({ label: o, correct: o === correct })),
            }]
        }
        case 'RETRIEVE': {
            const recall = byType('recall')
            const accepted = strs((recall?.expectedOutput as any)?.accepted)
            const expected = accepted.length ? accepted : (t.examples.length ? t.examples.slice(0, 3) : [example])
            if (!expected[0]) return []
            return [{
                kind: 'speak',
                prompt: str(recall?.prompt) ?? st.learnerAction,
                expected, accept: expected, hints: expected.slice(0, 1),
                stage: 'RETRIEVE',
            }]
        }
        case 'PRODUCE': {
            const guide = byType('guided_speaking')
            const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
            if (!expected[0]) return []
            return [{
                kind: 'speak',
                prompt: str(guide?.prompt) ?? st.learnerAction,
                npcLine: example || undefined,
                expected, accept: expected,
                hints: strs((guide?.input as any)?.support).slice(0, 2),
                open: true,
                stage: 'PRODUCE',
            }]
        }
        case 'INTERACT': {
            const beats: SceneBeat[] = []
            const gi = byType('guided_interaction')
            const opening = str((gi?.input as any)?.opening) ?? example
            if (opening) {
                beats.push({
                    kind: 'unexpected', character: other, es: opening,
                    gloss: ctx.gloss(opening),
                    accept: t.examples.length ? t.examples : [opening],
                    stage: 'INTERACT',
                })
            }
            const rp = byType('role_play')
            if (rp && example) {
                beats.push({
                    kind: 'speak',
                    prompt: str(rp?.purpose) ?? 'Keep the exchange going.',
                    expected: t.examples.length ? t.examples : [example],
                    accept: t.examples, open: true,
                    stage: 'INTERACT',
                })
            }
            return beats
        }
        case 'TRANSFER': {
            const beats: SceneBeat[] = [{ kind: 'transfer-intro', text: 'Same ability. New situation.', setting: bp.transferSetting, stage: 'TRANSFER' }]
            const sim = byType('simulation')
            const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
            if (expected[0]) {
                beats.push({
                    kind: 'speak',
                    prompt: str(sim?.prompt) ?? st.learnerAction,
                    expected, accept: expected, hints: [], open: true,
                    stage: 'TRANSFER',
                })
            }
            return beats
        }
        case 'RETAIN':
            return [{ kind: 'action', text: bp.retain || st.objective, stage: 'RETAIN' }]
        default:
            return []
    }
}

export function compileScene(bp: SceneBlueprint, lesson: any): SceneSpec {
    const t = targetFromLesson(lesson)
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
    const engine = extractEngine(lesson)

    let beats: SceneBeat[]
    if (engine) {
        // DB payload drives the scene; archetype fills genuine gaps only.
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

    // Defense in depth: never render empty say/listen beats or dead choices.
    beats = beats.filter(b => {
        if ((b.kind === 'say' || b.kind === 'listen') && !(b as any).es?.trim()) return false
        if (b.kind === 'choice' && !b.options.some(o => o.label?.trim())) return false
        return true
    })

    // Runtime personalization: once the learner's name is known, the world uses it.
    beats = applyLearnerName(beats, getLearnerName())

    return {
        id: bp.id,
        competencyCodes: [bp.competency],
        environment: bp.environment,
        setting: `Madrid · ${bp.environment === 'cafe' ? 'A small café' : 'The street'} · ${bp.timeOfDay === 'evening' ? '19:30' : '9:42'}`,
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
    if (!spec.beats.some(b => b.kind === 'speak')) errs.push(`${bp.id}: no production beat`)
    if (!spec.beats.some(b => b.kind === 'choice')) errs.push(`${bp.id}: no meaning check`)
    return errs
}