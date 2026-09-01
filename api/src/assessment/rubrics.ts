import { createHash } from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import { AppError } from '../lib/errors'
import { compileRubric } from './rubric'
import { canonicalJSON } from '../scenes/compiler'
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
export class RubricService {
    constructor(private db: PrismaClient, private clock: () => Date = () => new Date()) {}
    async draft(actor: string, input: unknown) {
        const compiled = compileRubric(input)
        return this.db.$transaction(async tx => {
            const existing = await tx.assessmentRubric.findUnique({ where: { targetKey_version: { targetKey: compiled.definition.targetKey, version: compiled.version } } })
            if (existing) return existing
            const row = await tx.assessmentRubric.create({ data: { targetKey: compiled.definition.targetKey, version: compiled.version, definition: json(compiled.definition), evaluatorVersion: compiled.evaluatorVersion, createdBy: actor } })
            await tx.assessmentAudit.create({ data: { rubricId: row.id, actor, action: 'rubric_draft', payload: json({ targetKey: row.targetKey, version: row.version }) } })
            return row
        })
    }
    async review(actor: string, id: string, note: string) {
        return this.db.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM "AssessmentRubric" WHERE id = ${id} FOR UPDATE`
            const row = await tx.assessmentRubric.findUnique({ where: { id } }); if (!row) throw new AppError('Rubric not found', 404)
            const compiled = compileRubric(row.definition)
            if (compiled.version !== row.version || compiled.evaluatorVersion !== row.evaluatorVersion) throw new AppError('Rubric integrity failed', 409)
            if (compiled.definition.calibration.sampleSize < 20 || compiled.definition.calibration.agreement < 0.75) throw new AppError('Rubric calibration requires at least 20 reviewed samples and agreement of 0.75', 409)
            if (row.status === 'reviewed') return row
            const updated = await tx.assessmentRubric.update({ where: { id }, data: { status: 'reviewed', reviewedBy: actor, reviewedAt: this.clock(), reviewNote: note } })
            await tx.assessmentAudit.create({ data: { rubricId: id, actor, action: 'rubric_reviewed', payload: json({ note, calibration: compiled.definition.calibration }) } })
            return updated
        })
    }
    async list(targetKey?: string) { return this.db.assessmentRubric.findMany({ where: targetKey ? { targetKey } : {}, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { audits: { orderBy: { createdAt: 'asc' } } } }) }
    static stableVersion(input: unknown) { return createHash('sha256').update(canonicalJSON(input)).digest('hex') }
}
