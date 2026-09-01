import { createHash } from 'node:crypto'
import { z } from 'zod'
import { AppError } from '../lib/errors'
import { canonicalJSON } from '../scenes/compiler'
export const ASSESSOR_VERSION = 'functional-rubric/1'
const criterionSchema = z.object({ id: z.string().min(1).max(80), description: z.string().min(5).max(500), matchAny: z.array(z.string().min(1).max(120)).min(1).max(30), required: z.boolean() }).strict()
export const rubricSchema = z.object({
    contract: z.literal('ecla.rubric/1'), targetKey: z.string().regex(/^(mission|gateway):[a-zA-Z0-9_-]+$/),
    claim: z.enum(['text_functional', 'spoken_functional']), criteria: z.array(criterionSchema).min(1).max(20),
    minLearnerTurns: z.number().int().min(1).max(10), requiresRepair: z.boolean(),
    calibration: z.object({ sampleSize: z.number().int().min(0), agreement: z.number().min(0).max(1), population: z.string().min(3).max(300) }).strict(),
}).strict().superRefine((rubric, context) => {
    if (new Set(rubric.criteria.map(item => item.id)).size !== rubric.criteria.length) context.addIssue({ code: 'custom', message: 'Criterion IDs must be unique' })
    if (rubric.claim === 'spoken_functional') context.addIssue({ code: 'custom', message: 'Automated text rubrics cannot claim spoken functional ability' })
})
export type Rubric = z.infer<typeof rubricSchema>
export function compileRubric(input: unknown) {
    const parsed = rubricSchema.safeParse(input)
    if (!parsed.success) throw new AppError(`Invalid rubric: ${parsed.error.issues.map(issue => issue.message).join('; ')}`, 400)
    const definition = parsed.data
    const version = createHash('sha256').update(canonicalJSON({ definition, evaluatorVersion: ASSESSOR_VERSION })).digest('hex')
    return { definition, version, evaluatorVersion: ASSESSOR_VERSION }
}
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[¡!¿?.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim()
export function evaluateRubric(rubric: Rubric, learnerTurns: string[], partnerTurns: number, repaired: boolean) {
    const corpus = normalize(learnerTurns.join(' '))
    const matches = rubric.criteria.map(item => ({ id: item.id, required: item.required, matched: item.matchAny.some(pattern => corpus.includes(normalize(pattern))) }))
    const required = matches.filter(item => item.required)
    const objectiveAchieved = required.length > 0 && required.every(item => item.matched)
    const coverage = matches.filter(item => item.matched).length / matches.length
    const enoughTurns = learnerTurns.length >= rubric.minLearnerTurns && partnerTurns >= learnerTurns.length
    const repairEvidence = !rubric.requiresRepair || repaired
    const calibrated = rubric.calibration.sampleSize >= 20 && rubric.calibration.agreement >= 0.75
    const confidence = Math.round(Math.min(rubric.calibration.agreement, coverage * (enoughTurns ? 1 : 0.6)) * 100) / 100
    const autoQualifies = objectiveAchieved && enoughTurns && repairEvidence && calibrated && confidence >= 0.75
    return { objectiveAchieved, meaningCommunicated: objectiveAchieved && partnerTurns > 0, comprehensionEvidence: enoughTurns ? 1 : 0.5, repairEvidence: repaired, independence: enoughTurns ? 1 : 0.5, confidence, autoQualifies, matches, calibrated }
}
