import { createHash } from 'node:crypto'
import { z } from 'zod'
import { SCENE_CONTRACT, type SceneDocument } from '../../../packages/contracts/scene'
import { AppError } from '../lib/errors'

export const COMPILER_VERSION = 'scene-compiler/1'
const text = z.string().trim().min(1).max(2000)
export const sceneSourceSchema = z.object({
    contract: z.literal(SCENE_CONTRACT), schemaVersion: z.literal(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
    competencyCode: z.string().regex(/^[A-Z0-9]+(?:\.[A-Z0-9]+)+$/).max(80),
    title: text, setting: text, objective: text, contextFingerprint: text,
    purpose: z.enum(['practice', 'transfer', 'retention']),
    experiment: z.object({ key: z.string().min(1).max(100), variant: z.string().min(1).max(100) }).strict().nullable().default(null),
    steps: z.array(z.object({
        id: z.string().min(1).max(100), stage: text,
        kind: z.enum(['encounter', 'choice', 'response']), prompt: text,
        speaker: text.optional(), line: text.optional(), translation: text.optional(),
        options: z.array(z.object({ id: z.string().min(1).max(100), label: text }).strict()).min(2).max(8).optional(),
        audio: z.object({ status: z.literal('tts_fallback'), locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/), rate: z.number().min(0.5).max(1.2) }).strict(),
    }).strict()).min(1).max(40),
}).strict().superRefine((source, context) => {
    if (new Set(source.steps.map(step => step.id)).size !== source.steps.length) context.addIssue({ code: 'custom', message: 'Task IDs must be unique' })
    for (const step of source.steps) {
        if (step.kind === 'choice' && !step.options) context.addIssue({ code: 'custom', message: `${step.id}: choices require options` })
        if (step.options && new Set(step.options.map(option => option.id)).size !== step.options.length) context.addIssue({ code: 'custom', message: `${step.id}: option IDs must be unique` })
        if (step.kind !== 'choice' && step.options) context.addIssue({ code: 'custom', message: `${step.id}: options only belong to choices` })
    }
})
export type SceneSource = z.infer<typeof sceneSourceSchema>

/** Stable key ordering makes semantically identical author JSON produce one version. */
export function canonicalJSON(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`
    if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJSON(item)}`).join(',')}}`
    return JSON.stringify(value)
}
export function compileScene(input: unknown) {
    const parsed = sceneSourceSchema.safeParse(input)
    if (!parsed.success) throw new AppError(`Invalid scene: ${parsed.error.issues.map(issue => issue.message).join('; ')}`, 400)
    const source = parsed.data
    const document: SceneDocument = { ...source, compilerVersion: COMPILER_VERSION, assessment: 'practice_only' }
    const version = createHash('sha256').update(canonicalJSON(document)).digest('hex')
    return { source, document, version, compilerVersion: COMPILER_VERSION, schemaVersion: 1 }
}

/** Explicit v0 -> v1 migration. Unknown fields/versions are rejected, never guessed. */
export function migrateSceneSource(input: unknown): SceneSource {
    const old = z.object({ schemaVersion: z.literal(0), slug: z.string(), competencyCode: z.string(), title: z.string(), environment: z.string(), objective: z.string(), contextFingerprint: z.string(), purpose: z.enum(['practice', 'transfer', 'retention']), steps: z.array(z.unknown()) }).strict().safeParse(input)
    if (!old.success) return compileScene(input).source
    const { environment, ...rest } = old.data
    return compileScene({ ...rest, contract: SCENE_CONTRACT, schemaVersion: 1, setting: environment, experiment: null }).source
}
