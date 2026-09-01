import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import type { Server } from 'node:http'
import { AssessmentService } from '../src/assessment/service'
import { RubricService } from '../src/assessment/rubrics'
import type { ConversationPartner, PartnerRequest } from '../src/assessment/providers'
import { createAssessmentRouter } from '../src/routes/assessment'
import { GATEWAY_SCENARIOS } from '../src/types/gateway'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Only the isolated localhost:55439/ecla_phase1_test database is allowed')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
class Partner implements ConversationPartner {
    calls = 0; failed = new Set<string>()
    async reply(request: PartnerRequest) {
        this.calls++
        const last = request.history.at(-1)?.text ?? ''
        if (last === 'retry once' && !this.failed.has(last)) { this.failed.add(last); throw new Error('temporary provider failure') }
        return { text: 'Entiendo. ¿Algo más?', model: 'test-partner/1' }
    }
}
const partner = new Partner(); const service = new AssessmentService(db, partner); const rubricService = new RubricService(db)
const users: string[] = []; let owner: string; let foreign: string; let competencyId: string; let missionId: string; let server: Server; let origin: string
const rubricInput = (targetKey: string) => ({ contract: 'ecla.rubric/1', targetKey, claim: 'text_functional', criteria: [{ id: 'hello', description: 'Learner opens the interaction', matchAny: ['hola'], required: true }], minLearnerTurns: 2, requiresRepair: false, calibration: { sampleSize: 24, agreement: 0.82, population: 'Independent Pre-A1 beginner calibration set' } })
async function makeUser() { const id = randomUUID(); users.push(id); await db.user.create({ data: { id, clerkId: `assess-${id}`, email: `${id}@example.invalid` } }); return id }
async function reviewedRubric(targetKey: string) { const row = await rubricService.draft('author:test', rubricInput(targetKey)); return rubricService.review('reviewer:test', row.id, 'Verified criterion labels against twenty-four independent samples') }
async function sendTwo(sessionId: string) { for (let i = 0; i < 2; i++) await service.turn(owner, sessionId, { responseKey: randomUUID(), text: i ? 'Hola otra vez' : 'Hola', source: 'typed' }) }

before(async () => {
    owner = await makeUser(); foreign = await makeUser()
    const comp = await db.competency.findUniqueOrThrow({ where: { code: 'PA1.SOC.GRT.01' } }); competencyId = comp.id
    const mission = await db.mission.create({ data: { competencyId, title: `Assessment ${randomUUID()}`, objective: 'Greet the partner', scenario: 'A doorway', successCriteria: {} } }); missionId = mission.id
    await db.competencyMastery.upsert({ where: { userId_competencyId: { userId: owner, competencyId } }, create: { userId: owner, competencyId, level: 'CONTROLLED', confidenceLevel: 80, performanceJson: { educatorReviewed: true } }, update: { level: 'CONTROLLED', confidenceLevel: 80, performanceJson: { educatorReviewed: true } } })
    await reviewedRubric(`mission:${missionId}`)
    const app = express(); app.use(express.json()); app.use(createAssessmentRouter(service, rubricService, async req => req.headers['x-user'] === 'foreign' ? foreign : owner, req => { if (req.headers.authorization !== 'Bearer admin') throw Object.assign(new Error('Forbidden'), { statusCode: 403 }); return 'reviewer:test' })); app.use((error: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error.statusCode ?? 500).json({ error: error.message }))
    server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) }); const address = server.address(); assert.ok(address && typeof address !== 'string'); origin = `http://127.0.0.1:${address.port}`
})
after(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); await db.user.deleteMany({ where: { id: { in: users } } }); await db.mission.delete({ where: { id: missionId } }); await db.$disconnect() })

test('mission sessions are resumable, ownership-bound, server-owned and idempotent across services', async () => {
    const key = randomUUID(); const other = new AssessmentService(db, partner)
    const sessions = await Promise.all([service.startMission(owner, competencyId, key), other.startMission(owner, competencyId, randomUUID())])
    assert.equal(sessions[0].id, sessions[1].id); assert.equal(sessions[0].turns.length, 0)
    await assert.rejects(service.get(foreign, sessions[0].id), /not found/)
    const responseKey = randomUUID(); await Promise.all([service.turn(owner, sessions[0].id, { responseKey, text: 'Hola', source: 'typed' }), other.turn(owner, sessions[0].id, { responseKey, text: 'Hola', source: 'typed' })])
    const stored = await service.get(owner, sessions[0].id)
    assert.equal(stored.turns.filter(turn => turn.role === 'learner').length, 1); assert.equal(stored.turns.filter(turn => turn.role === 'partner').length, 1)
    assert.equal(await db.assessmentAudit.count({ where: { sessionId: stored.id, action: 'learner_turn' } }), 1)
    await assert.rejects(service.turn(owner, stored.id, { responseKey, text: 'fabricated replacement', source: 'typed' }), /another utterance/)
    await service.turn(owner, stored.id, { responseKey: randomUUID(), text: 'Hola otra vez', source: 'typed' }); await service.evaluateScenario(owner, stored.id)
})
test('provider failure stores the learner turn, audits failure and retries the same request safely', async () => {
    const session = await service.startMission(owner, competencyId, randomUUID()); const responseKey = randomUUID()
    await assert.rejects(service.turn(owner, session.id, { responseKey, text: 'retry once', source: 'typed' }), /unavailable/)
    let stored = await service.get(owner, session.id); assert.equal(stored.turns.filter(turn => turn.role === 'learner').length, 1); assert.equal(stored.turns.filter(turn => turn.role === 'partner').length, 0)
    stored = await service.turn(owner, session.id, { responseKey, text: 'retry once', source: 'typed' }); assert.equal(stored.turns.filter(turn => turn.role === 'learner').length, 1); assert.equal(stored.turns.filter(turn => turn.role === 'partner').length, 1)
    assert.equal(await db.assessmentAudit.count({ where: { sessionId: session.id, action: 'provider_failed' } }), 1)
    await service.turn(owner, session.id, { responseKey: randomUUID(), text: 'Hola', source: 'typed' }); await service.evaluateScenario(owner, session.id)
})
test('mission evaluation consumes saved turns, records confidence, and cannot award XP or mastery', async () => {
    const session = await service.startMission(owner, competencyId, randomUUID()); await sendTwo(session.id)
    const before = await db.user.findUniqueOrThrow({ where: { id: owner } }); const masteryBefore = await db.competencyMastery.findUniqueOrThrow({ where: { userId_competencyId: { userId: owner, competencyId } } })
    const evaluated = await service.evaluateScenario(owner, session.id); assert.equal(evaluated.status, 'awaiting_review'); assert.equal(evaluated.result?.autoQualifies, true); assert.equal(evaluated.result?.intelligibility, null); assert.match(evaluated.result!.explanation, /acoustic review/)
    const after = await db.user.findUniqueOrThrow({ where: { id: owner } }); const masteryAfter = await db.competencyMastery.findUniqueOrThrow({ where: { userId_competencyId: { userId: owner, competencyId } } })
    assert.equal(after.xpTotal, before.xpTotal); assert.equal(masteryAfter.level, masteryBefore.level); assert.equal(masteryAfter.confidenceLevel, masteryBefore.confidenceLevel)
    await assert.rejects(service.humanReview('reviewer:test', (await db.assessmentScenarioResult.findFirstOrThrow({ where: { sessionId: session.id } })).id, { approved: true, expectedDecision: null, confidence: .9, intelligibility: .9, acousticObservationId: null, note: 'Reviewed transcript and attempted approval without audio' }), /acoustic/)
})
test('HTTP rejects client history, scores, evaluator claims, foreign reads and old forged routes', async () => {
    const session = await service.startMission(owner, competencyId, randomUUID()); const headers = { 'Content-Type': 'application/json' }
    const forged = await fetch(`${origin}/api/v1/assessment-sessions/${session.id}/turns`, { method: 'POST', headers, body: JSON.stringify({ responseKey: randomUUID(), text: 'Hola', source: 'typed', history: [{ role: 'learner', text: 'fake' }], score: 100 }) }); assert.equal(forged.status, 400)
    assert.equal((await fetch(`${origin}/api/v1/assessment-sessions/${session.id}`, { headers: { 'x-user': 'foreign' } })).status, 404)
    const old = await fetch(`${origin}/api/v1/missions/${competencyId}/evaluate`, { method: 'POST', headers, body: JSON.stringify({ transcript: [{ text: 'fake' }] }) }); assert.equal(old.status, 404) // test router exposes only replacement routes
    await sendTwo(session.id); await service.evaluateScenario(owner, session.id)
})
test('rubric review enforces calibration and immutable observation/audit fields', async () => {
    const draft = await rubricService.draft('author:test', { ...rubricInput('gateway:calibration_test'), calibration: { sampleSize: 19, agreement: .99, population: 'Too small sample' } })
    await assert.rejects(rubricService.review('reviewer:test', draft.id, 'Attempt review with a sample below the required threshold'), /at least 20/)
    const mission = await service.startMission(owner, competencyId, randomUUID()); await sendTwo(mission.id); await service.evaluateScenario(owner, mission.id)
    const turn = await db.assessmentSessionTurn.findFirstOrThrow({ where: { sessionId: mission.id } }); await assert.rejects(db.assessmentSessionTurn.update({ where: { id: turn.id }, data: { text: 'changed' } }), /append-only/)
    const audit = await db.assessmentAudit.findFirstOrThrow({ where: { sessionId: mission.id } }); await assert.rejects(db.assessmentAudit.update({ where: { id: audit.id }, data: { actor: 'changed' } }), /append-only/)
})
test('Gateway enforces full readiness, seven reviewed rubrics and five human acoustic approvals', async () => {
    await assert.rejects(service.startGateway(foreign, randomUUID()))
    const course = await db.course.findFirstOrThrow({ where: { cefrLevel: 'Pre-A1', language: { code: 'es' } } }); await db.course.update({ where: { id: course.id }, data: { isPublished: true } })
    const competencies = await db.competency.findMany({ where: { isCore: true, unit: { courseId: course.id } } })
    for (const competency of competencies) await db.competencyMastery.upsert({ where: { userId_competencyId: { userId: owner, competencyId: competency.id } }, create: { userId: owner, competencyId: competency.id, level: 'CONTROLLED', confidenceLevel: 80, performanceJson: { educatorReviewed: true } }, update: { level: 'CONTROLLED', confidenceLevel: 80, performanceJson: { educatorReviewed: true } } })
    for (const scenario of GATEWAY_SCENARIOS) await reviewedRubric(`gateway:${scenario}`)
    const session = await service.startGateway(owner, randomUUID()); assert.equal(session.scenarioTotal, 7); assert.equal(session.turns[0].role, 'partner')
    for (let index = 0; index < GATEWAY_SCENARIOS.length; index++) { await sendTwo(session.id); await service.evaluateScenario(owner, session.id) }
    let stored = await service.get(owner, session.id); assert.equal(stored.status, 'awaiting_review'); await assert.rejects(service.finalizeGateway(owner, session.id), /final review|Complete all|/)
    const rows = await db.assessmentScenarioResult.findMany({ where: { sessionId: session.id }, orderBy: { evaluatedAt: 'asc' } })
    for (const [index, row] of rows.entries()) {
        if (index < 5) { const acoustic = await service.recordAcoustic('reviewer:test', session.id, { scenarioId: row.scenarioId, providerReference: `consented://${row.id}`, providerVersion: 'human-listening/1', metrics: { intelligibility: .9 }, confidence: .9, consentAttested: true, note: 'Consent verified and audio independently reviewed for intelligibility' }); await service.humanReview('reviewer:test', row.id, { approved: true, expectedDecision: null, confidence: .9, intelligibility: .9, acousticObservationId: acoustic.id, note: 'Objective and intelligibility independently approved from stored evidence' }) }
        else await service.humanReview('reviewer:test', row.id, { approved: false, expectedDecision: null, confidence: .8, intelligibility: null, acousticObservationId: null, note: 'Functional objective was not approved in this scenario review' })
    }
    stored = await service.finalizeGateway(owner, session.id); assert.equal(stored.finalDecision?.passed, true); assert.equal(stored.finalDecision?.passedScenarios, 5); assert.equal(stored.finalDecision?.confidence, .9)
    assert.equal((await service.finalizeGateway(owner, session.id)).finalDecision?.passed, true)
    await assert.rejects(service.recordAcoustic('reviewer:test', session.id, { scenarioId: rows[0].scenarioId, providerReference: 'consented://late', providerVersion: 'human-listening/1', metrics: { intelligibility: .9 }, confidence: .9, consentAttested: true, note: 'Late evidence must not change a final assessment' }), /final/)
    await assert.rejects(service.humanReview('reviewer:test', rows[0].id, { approved: false, expectedDecision: true, confidence: .9, intelligibility: null, acousticObservationId: null, note: 'Late review must not change a final assessment' }), /final/)
    await assert.rejects(db.assessmentSession.update({ where: { id: session.id }, data: { finalDecision: { passed: false } } }), /final decision is immutable/)
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: owner } })).xpTotal, 0)
    assert.ok((await db.assessmentAudit.findMany({ where: { sessionId: session.id } })).some(row => row.action === 'final_decision'))
})
