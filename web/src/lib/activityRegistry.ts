/**
 * activityRegistry — Phase 22: single map from DB activity types → SceneBeat[].
 * compileScene delegates here; archetypes fill gaps only when no beats emit.
 */
import type { SceneBeat, StageName } from '@/lib/sceneTypes'
import type { StageActivity, StagePayload } from '@/lib/lessonPayload'
import type { Ctx, Target } from '@/content/scenes/archetypes'

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const strs = (v: unknown): string[] =>
    Array.isArray(v)
        ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(s => s.trim())
        : []

type Handler = (act: StageActivity, ctx: Ctx, st: StagePayload, t: Target) => SceneBeat[]

function stageOf(st: StagePayload): StageName {
    return st.stage
}

const handlers: Record<string, Handler> = {
    context: (act, ctx, st) => {
        const scenario =
            str((act.input as any)?.scenario) ?? str((act.input as any)?.targetLanguage) ?? st.objective
        return [{ kind: 'action', text: scenario, stage: stageOf(st) }]
    },
    listening: (act, ctx, st, t) => {
        const main = ctx.main
        const utter = strs((act.input as any)?.utterances)
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const es = utter[0] ?? example
        return es ? [{ kind: 'listen', character: main, es, gloss: ctx.gloss(es), stage: stageOf(st) }] : []
    },
    comprehension: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        let options = strs((act.input as any)?.options)
        const correct = str(act.expectedOutput) ?? options[0] ?? example
        if (correct && !options.includes(correct)) options = [correct, ...options]
        if (!correct || options.length < 2) return []
        return [{
            kind: 'choice',
            prompt: str(act.prompt) ?? 'What is happening here?',
            stage: stageOf(st),
            options: options.slice(0, 4).map(o => ({ label: o, correct: o === correct })),
        }]
    },
    noticing: (act, ctx, st) => {
        const main = ctx.main
        const patterns = strs((act.input as any)?.patterns).slice(0, 2)
        return patterns.map(p => ({
            kind: 'listen' as const,
            character: main,
            es: p,
            gloss: ctx.gloss(p),
            stage: stageOf(st),
        }))
    },
    pronunciation: (act, ctx, st, t) => {
        const main = ctx.main
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const pes = str((act.input as any)?.target) ?? example
        if (!pes) return []
        const note = str((act.input as any)?.note)
        return [
            { kind: 'listen', character: main, es: pes, gloss: note ?? undefined, stage: stageOf(st) },
            {
                kind: 'speak',
                prompt: str(act.prompt) ?? 'Repeat clearly — intelligibility matters more than accent.',
                expected: [pes],
                accept: [pes],
                hints: note ? [note] : [pes],
                assessIntelligibility: true,
                stage: stageOf(st),
            },
        ]
    },
    recognition: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        let options = strs((act.input as any)?.options)
        const correct = str(act.expectedOutput) ?? example
        if (correct && !options.includes(correct)) options = [correct, ...options]
        if (!correct || options.length < 2) return []
        return [{
            kind: 'choice',
            prompt: str(act.prompt) ?? 'Which one helps you?',
            stage: stageOf(st),
            options: options.slice(0, 5).map(o => ({ label: o, correct: o === correct })),
        }]
    },
    listening_discrimination: (act, ctx, st, t) => {
        const main = ctx.main
        const target = str((act.input as any)?.target) ?? t.examples[0] ?? ''
        const distractors = strs((act.input as any)?.distractors)
        const pool = [target, ...distractors].filter(Boolean)
        if (!target || pool.length < 2) return []
        return [
            { kind: 'listen', character: main, es: target, gloss: ctx.gloss(target), stage: stageOf(st) },
            {
                kind: 'choice',
                prompt: str(act.prompt) ?? 'Which phrase did you hear?',
                stage: stageOf(st),
                options: pool.slice(0, 4).map(o => ({ label: o, correct: o === target })),
            },
        ]
    },
    recall: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const accepted = strs((act.expectedOutput as any)?.accepted)
        const expected = accepted.length ? accepted : (t.examples.length ? t.examples.slice(0, 3) : [example])
        if (!expected[0]) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? st.learnerAction,
            expected,
            accept: expected,
            hints: expected.slice(0, 1),
            stage: stageOf(st),
        }]
    },
    completion: (act, ctx, st, t) => {
        const frame = str((act.input as any)?.sentenceFrame) ?? t.patterns[0] ?? ''
        const answer = t.examples[0] ?? frame
        if (!answer) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? 'Complete the expression.',
            expected: [answer],
            accept: t.examples.length ? t.examples : [answer],
            hints: frame ? [frame] : [answer],
            stage: stageOf(st),
        }]
    },
    guided_speaking: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
        if (!expected[0]) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? st.learnerAction,
            npcLine: example || undefined,
            expected,
            accept: expected,
            hints: strs((act.input as any)?.support).slice(0, 2),
            open: true,
            stage: stageOf(st),
        }]
    },
    free_retrieval: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
        if (!expected[0]) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? str((act.input as any)?.scenario) ?? st.learnerAction,
            expected,
            accept: expected,
            open: true,
            stage: stageOf(st),
        }]
    },
    guided_interaction: (act, ctx, st, t) => {
        const other = (ctx.other ?? ctx.main) as typeof ctx.main
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const opening = str((act.input as any)?.opening) ?? example
        if (!opening) return []
        return [{
            kind: 'unexpected',
            character: other,
            es: opening,
            gloss: ctx.gloss(opening),
            accept: t.examples.length ? t.examples : [opening],
            stage: stageOf(st),
        }]
    },
    role_play: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        if (!example) return []
        return [{
            kind: 'speak',
            prompt: str(act.purpose) ?? 'Keep the exchange going.',
            expected: t.examples.length ? t.examples : [example],
            accept: t.examples,
            open: true,
            stage: stageOf(st),
        }]
    },
    simulation: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
        if (!expected[0]) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? st.learnerAction,
            expected,
            accept: expected,
            hints: [],
            open: true,
            stage: stageOf(st),
        }]
    },
    unexpected_interaction: (act, ctx, st, t) => {
        const other = (ctx.other ?? ctx.main) as typeof ctx.main
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const line = example || str((act.input as any)?.change) || 'Un momento…'
        return [{
            kind: 'unexpected',
            character: other,
            es: line,
            gloss: ctx.gloss(line),
            accept: t.examples.length ? t.examples : [line],
            stage: stageOf(st),
        }]
    },
    transformation: (act, ctx, st, t) => {
        const answer = str(act.expectedOutput) ?? t.examples[1] ?? t.examples[0] ?? ''
        if (!answer) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? 'Say it in the new form.',
            expected: [answer],
            accept: strs((act.input as any)?.accept).length ? strs((act.input as any)?.accept) : [answer],
            hints: strs((act.input as any)?.frames).slice(0, 1),
            stage: stageOf(st),
        }]
    },
    spaced_retrieval: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const expected = t.examples.length ? t.examples.slice(0, 3) : [example]
        if (!expected[0]) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? 'Retrieve from memory — no hints.',
            expected,
            accept: expected,
            open: true,
            stage: stageOf(st),
        }]
    },
    mixed_context_review: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
        if (!expected[0]) return []
        return [{
            kind: 'speak',
            prompt: str(act.prompt) ?? 'Same ability — new context.',
            expected,
            accept: expected,
            open: true,
            stage: stageOf(st),
        }]
    },
    reading_comprehension: (act, ctx, st, t) => {
        const passage = str((act.input as any)?.passage) ?? t.examples[0] ?? t.patterns[0] ?? ''
        let options = strs((act.input as any)?.options)
        const correct = str(act.expectedOutput) ?? options[0] ?? ''
        if (!passage || !correct) return []
        if (!options.includes(correct)) options = [correct, ...options]
        if (options.length < 2) return []
        return [{
            kind: 'read',
            passage,
            prompt: str(act.prompt) ?? 'What does this mean?',
            stage: stageOf(st),
            options: options.slice(0, 4).map(o => ({ label: o, correct: o === correct })),
        }]
    },
    writing_production: (act, ctx, st, t) => {
        const example = t.examples[0] ?? t.patterns[0] ?? ''
        const expected = t.examples.length ? t.examples.slice(0, 4) : [example]
        if (!expected[0]) return []
        return [{
            kind: 'write',
            prompt: str(act.prompt) ?? str((act.input as any)?.scenario) ?? st.learnerAction,
            expected,
            accept: expected,
            open: true,
            stage: stageOf(st),
        }]
    },
}

/** Map one DB activity to zero or more player-native beats. */
export function activityToBeats(
    act: StageActivity,
    ctx: Ctx,
    st: StagePayload,
    t: Target,
): SceneBeat[] {
    const fn = handlers[act.type]
    if (!fn) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[ecla] activityRegistry: unmapped type "${act.type}"`)
        }
        return []
    }
    return fn(act, ctx, st, t)
}

/** All activity types with registered handlers (for validation). */
export const REGISTERED_ACTIVITY_TYPES = Object.keys(handlers)
