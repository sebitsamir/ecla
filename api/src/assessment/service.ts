import { Prisma, type PrismaClient, type AssessmentSession as SessionRow } from '@prisma/client'
import { z } from 'zod'
import { createHash, randomInt } from 'node:crypto'
import { AppError } from '../lib/errors'
import { ASSESSMENT_CONTRACT, type AssessmentSession, type AssessmentResult } from '../../../packages/contracts/assessment'
import { GATEWAY_CONFIGS, GATEWAY_SCENARIOS, type GatewayScenarioId } from '../types/gateway'
import { compileRubric, evaluateRubric, rubricSchema, type Rubric } from './rubric'
import type { ConversationPartner } from './providers'
import { canonicalJSON } from '../scenes/compiler'
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
const TTL = 2 * 60 * 60 * 1000
const snapshotSchema = z.object({
    title: z.string(), objective: z.string(), scenarios: z.record(z.string(), z.object({ targetKey: z.string(), title: z.string(), objective: z.string(), role: z.string(), setting: z.string(), openingLine: z.string().nullable(), rubricId: z.uuid() }).strict()),
    rubric: rubricSchema.optional(), readiness: z.unknown(),
}).strict()
type Tx = Prisma.TransactionClient
type ScenarioSnapshot = z.infer<typeof snapshotSchema>['scenarios'][string]

export class AssessmentService {
    constructor(private db: PrismaClient, private partner: ConversationPartner, private clock: () => Date = () => new Date()) {}
    private transaction<T>(userId: string, work: (tx: Tx) => Promise<T>): Promise<T> {
        return this.db.$transaction(async tx => {
            const users = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
            if (!users.length) throw new AppError('Learner not found', 404)
            return work(tx)
        }, { maxWait: 10000, timeout: 15000 })
    }
    private async owned(tx: Tx | PrismaClient, userId: string, id: string) {
        const row = await tx.assessmentSession.findFirst({ where: { id, userId }, include: { turns: { orderBy: { sequence: 'asc' } }, results: true } })
        if (!row) throw new AppError('Assessment session not found', 404)
        return row
    }
    private active(row: SessionRow) {
        if (row.status !== 'active' || row.expiresAt <= this.clock()) throw new AppError('Assessment session is no longer active', 409)
    }
    private scenario(row: SessionRow): string { return row.scenarioOrder[row.currentScenario] ?? 'mission' }
    private toResult(row: { scenarioId: string; objectiveAchieved: boolean; meaningCommunicated: boolean; comprehensionEvidence: number; repairEvidence: boolean; independence: number; intelligibility: number | null; confidence: number; autoQualifies: boolean; humanDecision: boolean | null; humanConfidence: number | null; evaluatorVersion: string }): AssessmentResult {
        const qualifies = row.humanDecision ?? row.autoQualifies
        return { scenarioId: row.scenarioId, objectiveAchieved: row.objectiveAchieved, meaningCommunicated: row.meaningCommunicated, comprehensionEvidence: row.comprehensionEvidence, repairEvidence: row.repairEvidence, independence: row.independence, intelligibility: row.intelligibility, confidence: row.humanConfidence ?? row.confidence, autoQualifies: row.autoQualifies, humanDecision: row.humanDecision, qualifiesForPromotion: qualifies, evaluatorVersion: row.evaluatorVersion, explanation: row.humanDecision === true ? 'A human reviewer approved this scenario with a consented acoustic observation.' : row.humanDecision === false ? 'A human reviewer did not approve this scenario.' : row.autoQualifies ? 'The calibrated text rubric matched; human acoustic review is still required for Gateway graduation.' : 'The server-owned text evidence did not meet the reviewed rubric with sufficient confidence.' }
    }
    private view(row: Awaited<ReturnType<AssessmentService['owned']>>): AssessmentSession {
        const snapshot = snapshotSchema.parse(row.eligibilitySnapshot)
        const scenarioId = this.scenario(row)
        const scenario = snapshot.scenarios[scenarioId]
        const expired = row.status === 'active' && row.expiresAt <= this.clock()
        const status = expired ? 'expired' : row.status as AssessmentSession['status']
        const result = row.results.find(item => item.scenarioId === scenarioId)
        return { contract: ASSESSMENT_CONTRACT, id: row.id, kind: row.kind as 'mission' | 'gateway', status, title: snapshot.title, objective: scenario?.objective ?? snapshot.objective, scenarioId, scenarioNumber: row.currentScenario + 1, scenarioTotal: row.scenarioOrder.length, openingLine: scenario?.openingLine ?? null, turns: row.turns.filter(turn => turn.scenarioId === scenarioId).map(turn => ({ sequence: turn.sequence, scenarioId: turn.scenarioId, role: turn.role as 'partner' | 'learner', text: turn.text, source: turn.source as 'provider' | 'typed' | 'transcript', observedAt: turn.observedAt.toISOString() })), result: result ? this.toResult(result) : null, expiresAt: row.expiresAt.toISOString(), finalDecision: row.finalDecision as AssessmentSession['finalDecision'] }
    }
    private async reviewedRubric(targetKey: string) {
        const rows = await this.db.assessmentRubric.findMany({ where: { targetKey, status: 'reviewed' }, orderBy: [{ reviewedAt: 'desc' }, { id: 'desc' }] })
        for (const row of rows) {
            const compiled = compileRubric(row.definition)
            if (compiled.version === row.version && compiled.evaluatorVersion === row.evaluatorVersion) return { row, rubric: compiled.definition }
        }
        throw new AppError(`No reviewed calibrated rubric is published for ${targetKey}`, 409)
    }
    private readiness(masteries: { level: string; confidenceLevel: number | null; performanceJson: unknown }[]) {
        const rank: Record<string, number> = { NOT_STARTED: 0, EXPOSED: 1, DEVELOPING: 2, CONTROLLED: 3, TRANSFERRED: 4, RETAINED: 5 }
        const ready = masteries.length > 0 && masteries.every(row => rank[row.level] >= 3 && (row.confidenceLevel ?? 0) >= 70 && !!row.performanceJson && (row.performanceJson as { educatorReviewed?: boolean }).educatorReviewed === true)
        return { ready, required: masteries.length, eligible: masteries.filter(row => rank[row.level] >= 3 && (row.confidenceLevel ?? 0) >= 70 && (row.performanceJson as { educatorReviewed?: boolean } | null)?.educatorReviewed === true).length }
    }
    private shuffledScenarios(): GatewayScenarioId[] {
        const values = [...GATEWAY_SCENARIOS]
        for (let index = values.length - 1; index > 0; index--) {
            const other = randomInt(index + 1); [values[index], values[other]] = [values[other], values[index]]
        }
        return values
    }
    async startMission(userId: string, competencyId: string, idempotencyKey: string) {
        const mission = await this.db.mission.findFirst({ where: { competencyId }, include: { competency: true } })
        if (!mission) throw new AppError('Mission not found', 404)
        const mastery = await this.db.competencyMastery.findUnique({ where: { userId_competencyId: { userId, competencyId } } })
        const readiness = this.readiness(mastery ? [mastery] : [])
        if (!readiness.ready) throw new AppError('Reviewed CONTROLLED evidence with confidence 70 or higher is required for a mission assessment.', 409)
        const { row: rubricRow, rubric } = await this.reviewedRubric(`mission:${mission.id}`)
        return this.transaction(userId, async tx => {
            const prior = await tx.assessmentSession.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, include: { turns: { orderBy: { sequence: 'asc' } }, results: true } })
            if (prior) return this.view(prior)
            await tx.assessmentSession.updateMany({ where: { userId, activeKey: `mission:${mission.id}`, expiresAt: { lte: this.clock() } }, data: { status: 'expired', activeKey: null } })
            const active = await tx.assessmentSession.findFirst({ where: { userId, activeKey: `mission:${mission.id}` }, include: { turns: { orderBy: { sequence: 'asc' } }, results: true } })
            if (active) return this.view(active)
            const now = this.clock()
            const scenario: ScenarioSnapshot = { targetKey: rubric.targetKey, title: mission.title, objective: mission.objective, role: 'A person in the mission situation', setting: mission.scenario, openingLine: null, rubricId: rubricRow.id }
            const missionReadiness = { ...readiness, competencyId, level: mastery!.level, confidence: mastery!.confidenceLevel, source: mastery!.performanceJson, lastAssessedAt: mastery!.lastAssessedAt }
            const snapshot = { title: mission.title, objective: mission.objective, scenarios: { mission: scenario }, rubric, readiness: missionReadiness }
            const session = await tx.assessmentSession.create({ data: { userId, kind: 'mission', missionId: mission.id, competencyId, rubricId: rubricRow.id, idempotencyKey, activeKey: `mission:${mission.id}`, scenarioOrder: ['mission'], eligibilitySnapshot: json(snapshot), curriculumVersion: createHash('sha256').update(canonicalJSON({ mission: mission.id, rubric: rubricRow.version })).digest('hex'), startedAt: now, expiresAt: new Date(now.getTime() + TTL) } })
            await tx.assessmentAudit.create({ data: { sessionId: session.id, actor: `learner:${userId}`, action: 'start', payload: json({ kind: 'mission', readiness: missionReadiness, rubricVersion: rubricRow.version }) } })
            return this.view(await this.owned(tx, userId, session.id))
        })
    }
    async startGateway(userId: string, idempotencyKey: string) {
        const candidates = await this.db.course.findMany({
            where: { cefrLevel: { in: ['Pre-A1', 'PRE_A1'] }, isPublished: true, language: { code: 'es' } },
            include: { units: { select: { competencies: { where: { isCore: true }, select: { id: true } } } } },
        })
        const populated = candidates.filter(item => item.units.some(unit => unit.competencies.length > 0))
        if (populated.length !== 1) throw new AppError(populated.length ? 'Ambiguous published Spanish Pre-A1 curricula' : 'Published Spanish Pre-A1 curriculum not found', 409)
        const course = populated[0]
        const competencyWhere = { isCore: true, unit: { courseId: course.id } }
        const masteries = await this.db.competencyMastery.findMany({ where: { userId, competency: competencyWhere } })
        const required = await this.db.competency.count({ where: competencyWhere })
        const readiness = this.readiness(masteries)
        if (required === 0 || masteries.length !== required || !readiness.ready) throw new AppError(`Gateway requires reviewed CONTROLLED evidence at confidence 70+ for all ${required} core Pre-A1 competencies.`, 409)
        const rubricEntries = await Promise.all(GATEWAY_SCENARIOS.map(async id => [id, await this.reviewedRubric(`gateway:${id}`)] as const))
        return this.transaction(userId, async tx => {
            const prior = await tx.assessmentSession.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, include: { turns: { orderBy: { sequence: 'asc' } }, results: true } })
            if (prior) return this.view(prior)
            await tx.assessmentSession.updateMany({ where: { userId, activeKey: 'gateway:pre-a1', expiresAt: { lte: this.clock() } }, data: { status: 'expired', activeKey: null } })
            const active = await tx.assessmentSession.findFirst({ where: { userId, activeKey: 'gateway:pre-a1' }, include: { turns: { orderBy: { sequence: 'asc' } }, results: true } })
            if (active) return this.view(active)
            const scenarios = Object.fromEntries(rubricEntries.map(([id, entry]) => [id, { targetKey: entry.rubric.targetKey, title: GATEWAY_CONFIGS[id].setting, objective: GATEWAY_CONFIGS[id].secretObjective, role: GATEWAY_CONFIGS[id].role, setting: GATEWAY_CONFIGS[id].setting, openingLine: GATEWAY_CONFIGS[id].openingLine, rubricId: entry.row.id }]))
            const scenarioOrder = this.shuffledScenarios()
            const now = this.clock(); const curriculumVersion = createHash('sha256').update(canonicalJSON({ required, masteries: masteries.map(item => [item.competencyId, item.lastAssessedAt]), rubrics: rubricEntries.map(([id, entry]) => [id, entry.row.version]) })).digest('hex')
            const gatewayReadiness = { ...readiness, courseId: course.id, items: masteries.map(item => ({ competencyId: item.competencyId, level: item.level, confidence: item.confidenceLevel, source: item.performanceJson, lastAssessedAt: item.lastAssessedAt })) }
            const session = await tx.assessmentSession.create({ data: { userId, kind: 'gateway', idempotencyKey, activeKey: 'gateway:pre-a1', scenarioOrder, eligibilitySnapshot: json({ title: 'Pre-A1 Gateway', objective: 'Communicate across seven reviewed functional situations.', scenarios, readiness: gatewayReadiness }), curriculumVersion, startedAt: now, expiresAt: new Date(now.getTime() + TTL) } })
            await tx.assessmentSessionTurn.create({ data: { sessionId: session.id, sequence: 0, scenarioId: scenarioOrder[0], role: 'partner', text: scenarios[scenarioOrder[0]].openingLine!, source: 'provider' } })
            await tx.assessmentAudit.create({ data: { sessionId: session.id, actor: `learner:${userId}`, action: 'start', payload: json({ kind: 'gateway', readiness: gatewayReadiness, curriculumVersion }) } })
            return this.view(await this.owned(tx, userId, session.id))
        })
    }
    async get(userId: string, id: string) { return this.view(await this.owned(this.db, userId, id)) }
    async turn(userId: string, id: string, input: { responseKey: string; text: string; source: 'typed' | 'transcript' }) {
        const claim = await this.transaction(userId, async tx => {
            const session = await this.owned(tx, userId, id); this.active(session)
            const previous = session.turns.find(turn => turn.responseKey === input.responseKey)
            if (previous) {
                if (previous.text !== input.text || previous.source !== input.source) throw new AppError('Response key belongs to another utterance', 409)
                const reply = session.turns.find(turn => turn.replyToKey === input.responseKey)
                return { session, scenario: snapshotSchema.parse(session.eligibilitySnapshot).scenarios[previous.scenarioId], existing: reply?.text ?? null, needsProvider: !reply }
            }
            if (session.results.some(result => result.scenarioId === this.scenario(session))) throw new AppError('Current scenario is already evaluated', 409)
            if (session.turns.filter(turn => turn.scenarioId === this.scenario(session) && turn.role === 'learner').length >= 10) throw new AppError('Turn limit reached; evaluate this scenario', 409)
            const sequence = (session.turns.at(-1)?.sequence ?? -1) + 1
            await tx.assessmentSessionTurn.create({ data: { sessionId: id, sequence, scenarioId: this.scenario(session), role: 'learner', text: input.text, source: input.source, responseKey: input.responseKey, repair: /no entiendo|repetir|despacio|otra vez/i.test(input.text) } })
            await tx.assessmentAudit.create({ data: { sessionId: id, actor: `learner:${userId}`, action: 'learner_turn', payload: json({ sequence, scenarioId: this.scenario(session), source: input.source }) } })
            return { session: await this.owned(tx, userId, id), scenario: snapshotSchema.parse(session.eligibilitySnapshot).scenarios[this.scenario(session)], existing: null, needsProvider: true }
        })
        if (claim.existing) return this.get(userId, id)
        let reply
        try { reply = await this.partner.reply({ kind: claim.session.kind as 'mission' | 'gateway', targetKey: claim.scenario.targetKey, role: claim.scenario.role, setting: claim.scenario.setting, objective: claim.scenario.objective, history: claim.session.turns.map(turn => ({ role: turn.role as 'partner' | 'learner', text: turn.text })) }) }
        catch (error) {
            await this.db.assessmentAudit.create({ data: { sessionId: id, actor: 'system:provider', action: 'provider_failed', payload: json({ responseKey: input.responseKey }) } })
            throw new AppError('Conversation provider is unavailable. Retry the same response safely.', 503)
        }
        return this.transaction(userId, async tx => {
            const session = await this.owned(tx, userId, id); this.active(session)
            if (!session.turns.some(turn => turn.replyToKey === input.responseKey)) {
                const sequence = (session.turns.at(-1)?.sequence ?? -1) + 1
                await tx.assessmentSessionTurn.create({ data: { sessionId: id, sequence, scenarioId: this.scenario(session), role: 'partner', text: reply.text, source: 'provider', replyToKey: input.responseKey, providerModel: reply.model } })
                await tx.assessmentAudit.create({ data: { sessionId: id, actor: 'system:provider', action: 'partner_turn', payload: json({ responseKey: input.responseKey, providerModel: reply.model }) } })
            }
            return this.view(await this.owned(tx, userId, id))
        })
    }
    async evaluateScenario(userId: string, id: string) {
        return this.transaction(userId, async tx => {
            const session = await this.owned(tx, userId, id); this.active(session)
            const scenarioId = this.scenario(session)
            if (session.results.some(result => result.scenarioId === scenarioId)) return this.view(session)
            const snapshot = snapshotSchema.parse(session.eligibilitySnapshot); const scenario = snapshot.scenarios[scenarioId]
            const rubricRow = await tx.assessmentRubric.findUniqueOrThrow({ where: { id: scenario.rubricId } }); const rubric = compileRubric(rubricRow.definition)
            if (rubric.version !== rubricRow.version || rubricRow.status !== 'reviewed') throw new AppError('Reviewed rubric integrity failed', 409)
            const turns = session.turns.filter(turn => turn.scenarioId === scenarioId)
            const evaluation = evaluateRubric(rubric.definition, turns.filter(turn => turn.role === 'learner').map(turn => turn.text), turns.filter(turn => turn.role === 'partner').length, turns.some(turn => turn.repair))
            await tx.assessmentScenarioResult.create({ data: { sessionId: id, scenarioId, rubricId: rubricRow.id, objectiveAchieved: evaluation.objectiveAchieved, meaningCommunicated: evaluation.meaningCommunicated, comprehensionEvidence: evaluation.comprehensionEvidence, repairEvidence: evaluation.repairEvidence, independence: evaluation.independence, confidence: evaluation.confidence, autoQualifies: evaluation.autoQualifies, evidence: json({ matches: evaluation.matches, calibrated: evaluation.calibrated, scope: 'text_functional', transcriptOwnedByServer: true }), evaluatorVersion: rubricRow.evaluatorVersion } })
            await tx.assessmentAudit.create({ data: { sessionId: id, rubricId: rubricRow.id, actor: 'system:evaluator', action: 'scenario_evaluated', payload: json({ scenarioId, evaluatorVersion: rubricRow.evaluatorVersion, confidence: evaluation.confidence, autoQualifies: evaluation.autoQualifies }) } })
            if (session.kind === 'mission' || session.currentScenario + 1 === session.scenarioOrder.length) await tx.assessmentSession.update({ where: { id }, data: { status: 'awaiting_review', activeKey: null } })
            else {
                const nextIndex = session.currentScenario + 1; const nextId = session.scenarioOrder[nextIndex]; const sequence = (session.turns.at(-1)?.sequence ?? -1) + 1
                await tx.assessmentSession.update({ where: { id }, data: { currentScenario: nextIndex } })
                await tx.assessmentSessionTurn.create({ data: { sessionId: id, sequence, scenarioId: nextId, role: 'partner', text: snapshot.scenarios[nextId].openingLine!, source: 'provider' } })
            }
            return this.view(await this.owned(tx, userId, id))
        })
    }
    async recordAcoustic(actor: string, id: string, input: { scenarioId: string; providerReference: string; providerVersion: string; metrics: Record<string, number>; confidence: number; consentAttested: true; note: string }) {
        return this.db.$transaction(async tx => {
            await tx.$queryRaw`SELECT id FROM "AssessmentSession" WHERE id = ${id} FOR UPDATE`
            const session = await tx.assessmentSession.findUnique({ where: { id } }); if (!session) throw new AppError('Assessment session not found', 404)
            if (session.finalDecision) throw new AppError('Assessment decision is final', 409)
            if (!await tx.assessmentScenarioResult.findUnique({ where: { sessionId_scenarioId: { sessionId: id, scenarioId: input.scenarioId } } })) throw new AppError('Evaluated scenario not found', 404)
            const result = await tx.acousticObservation.create({ data: { sessionId: id, scenarioId: input.scenarioId, providerReference: input.providerReference, providerVersion: input.providerVersion, metrics: json(input.metrics), confidence: input.confidence, consentAttested: true, status: 'reviewed', reviewedBy: actor, reviewNote: input.note } })
            await tx.assessmentAudit.create({ data: { sessionId: id, actor, action: 'acoustic_observation_reviewed', payload: json({ scenarioId: input.scenarioId, observationId: result.id, providerVersion: input.providerVersion, confidence: input.confidence, consentAttested: true }) } })
            return result
        })
    }
    async humanReview(actor: string, resultId: string, input: { approved: boolean; expectedDecision: boolean | null; confidence: number; intelligibility: number | null; acousticObservationId: string | null; note: string }) {
        return this.db.$transaction(async tx => {
            const row = await tx.assessmentScenarioResult.findUnique({ where: { id: resultId }, include: { session: true } }); if (!row) throw new AppError('Scenario result not found', 404)
            await tx.$queryRaw`SELECT id FROM "AssessmentSession" WHERE id = ${row.sessionId} FOR UPDATE`
            const currentSession = await tx.assessmentSession.findUniqueOrThrow({ where: { id: row.sessionId } })
            if (currentSession.finalDecision) throw new AppError('Assessment decision is final', 409)
            await tx.$queryRaw`SELECT id FROM "AssessmentScenarioResult" WHERE id = ${resultId} FOR UPDATE`
            const current = await tx.assessmentScenarioResult.findUniqueOrThrow({ where: { id: resultId } })
            if (current.humanDecision !== input.expectedDecision) throw new AppError('Review changed; reload before deciding', 409)
            if (input.approved) {
                if (!input.acousticObservationId) throw new AppError('Approval requires a consented reviewed acoustic observation', 409)
                const observation = await tx.acousticObservation.findFirst({ where: { id: input.acousticObservationId, sessionId: row.sessionId, scenarioId: row.scenarioId, consentAttested: true, status: 'reviewed' } })
                if (!observation) throw new AppError('Matching reviewed acoustic observation not found', 409)
            }
            const updated = await tx.assessmentScenarioResult.update({ where: { id: resultId }, data: { humanDecision: input.approved, humanConfidence: input.confidence, intelligibility: input.intelligibility, reviewedBy: actor, reviewedAt: this.clock(), reviewNote: input.note } })
            await tx.assessmentAudit.create({ data: { sessionId: row.sessionId, rubricId: row.rubricId, actor, action: 'human_review', payload: json({ resultId, approved: input.approved, confidence: input.confidence, acousticObservationId: input.acousticObservationId }) } })
            if (currentSession.kind === 'mission') {
                await tx.assessmentSession.update({ where: { id: row.sessionId }, data: { status: 'completed', completedAt: this.clock(), finalDecision: json({ passed: input.approved, passedScenarios: input.approved ? 1 : 0, required: 1, confidence: input.confidence, explanation: input.approved ? 'Human review approved this mission with consented acoustic evidence.' : 'Human review did not approve this mission.' }) } })
            }
            return this.toResult(updated)
        })
    }
    async finalizeGateway(userId: string, id: string) {
        return this.transaction(userId, async tx => {
            let session = await this.owned(tx, userId, id)
            await tx.$queryRaw`SELECT id FROM "AssessmentSession" WHERE id = ${id} FOR UPDATE`
            session = await this.owned(tx, userId, id)
            if (session.kind !== 'gateway' || session.results.length !== GATEWAY_SCENARIOS.length || session.status === 'active') throw new AppError('Complete all Gateway scenarios before final review', 409)
            if (session.finalDecision) return this.view(session)
            if (session.results.some(result => result.humanDecision === null)) throw new AppError('Every Gateway scenario needs a human review decision before finalization', 409)
            const passedRows = session.results.filter(result => result.humanDecision === true)
            const confidence = passedRows.length ? Math.round(passedRows.reduce((sum, row) => sum + (row.humanConfidence ?? 0), 0) / passedRows.length * 100) / 100 : 0
            const passed = passedRows.length >= 5 && confidence >= 0.75
            const decision = { passed, passedScenarios: passedRows.length, required: 5, confidence, explanation: passed ? 'At least five of seven server-owned scenarios were approved with consented acoustic observations.' : 'Gateway graduation requires five of seven human-approved scenarios and average confidence of at least 0.75.' }
            await tx.assessmentSession.update({ where: { id }, data: { status: 'completed', completedAt: this.clock(), finalDecision: json(decision), activeKey: null } })
            await tx.assessmentAudit.create({ data: { sessionId: id, actor: 'system:gateway', action: 'final_decision', payload: json(decision) } })
            return this.view(await this.owned(tx, userId, id))
        })
    }
}
