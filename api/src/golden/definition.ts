import { z } from 'zod'
import type { GoldenStep } from '../../../packages/contracts/golden'

export const EVALUATOR_VERSION = 'greeting-functional-exact/1'
export const DAY_MS = 24 * 60 * 60 * 1000
export const dimensionSchema = z.enum(['comprehension', 'retrieval', 'production', 'interaction', 'transfer', 'retention'])
export const stepSchema = z.object({
    id: z.string().min(1), stage: z.string(),
    kind: z.enum(['encounter', 'choice', 'response']),
    prompt: z.string().min(1), speaker: z.string().optional(), line: z.string().optional(), translation: z.string().optional(),
    options: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    audio: z.object({ status: z.literal('tts_fallback'), locale: z.string(), rate: z.number().min(0.5).max(1.2) }),
    accepted: z.array(z.string().min(1)),
    dimension: dimensionSchema.nullable(),
    repair: z.boolean().default(false),
    model: z.string().min(1),
}).strict()
export const definitionSchema = z.object({
    contract: z.literal('golden-greeting/1'),
    competencyCode: z.literal('PA1.SOC.GRT.01'),
    title: z.string(), setting: z.string(), contextFingerprint: z.string().min(1),
    purpose: z.enum(['practice', 'transfer', 'retention']),
    evaluatorVersion: z.literal(EVALUATOR_VERSION),
    culturalNote: z.string(), steps: z.array(stepSchema).min(3).max(20),
}).strict().superRefine((definition, ctx) => {
    if (new Set(definition.steps.map(step => step.id)).size !== definition.steps.length) {
        ctx.addIssue({ code: 'custom', message: 'Duplicate step IDs' })
    }
    for (const step of definition.steps) {
        if (step.kind !== 'encounter' && (!step.accepted.length || !step.dimension)) {
            ctx.addIssue({ code: 'custom', message: 'Scored activities require an answer key and dimension' })
        }
        if (step.kind === 'choice' && (!step.options?.length || !step.accepted.every(answer => step.options?.some(option => option.id === answer)))) {
            ctx.addIssue({ code: 'custom', message: 'Choice answer is absent from options' })
        }
        if (definition.purpose !== 'practice' && step.kind === 'encounter') {
            ctx.addIssue({ code: 'custom', message: 'Independent assessments must not show models before responses' })
        }
    }
})
export type GoldenDefinition = z.infer<typeof definitionSchema>
export type DefinedStep = z.infer<typeof stepSchema>

export const startSchema = z.object({ sceneVersionId: z.string().min(1).max(100), idempotencyKey: z.uuid() }).strict()
export const responseSchema = z.object({ sequence: z.number().int().min(0).max(19), responseKey: z.uuid(), answer: z.string().trim().min(1).max(300) }).strict()
export const supportSchema = z.object({ sequence: z.number().int().min(0).max(19) }).strict()
export const completeSchema = z.object({}).strict()

export function publicStep(step: DefinedStep): GoldenStep {
    const { id, stage, kind, prompt, speaker, line, translation, options, audio } = step
    return { id, stage, kind, prompt, speaker, line, translation, options, audio }
}

export function normalizeGreeting(answer: string): string {
    return answer.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
        .replace(/[¡!¿?.,;:]/g, '').replace(/\s+/g, ' ').trim()
}

export function gradeStep(step: DefinedStep, answer: string): boolean {
    if (step.kind === 'encounter') return answer === 'continue'
    if (step.kind === 'choice') return step.accepted.includes(answer)
    return step.accepted.some(accepted => normalizeGreeting(accepted) === normalizeGreeting(answer))
}
