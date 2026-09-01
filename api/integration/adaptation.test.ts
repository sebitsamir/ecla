import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { AdaptationService } from '../src/adaptation/service'
import { seedGolden } from '../src/golden/seed'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Set TEST_DATABASE_URL to localhost:55439/ecla_phase1_test only')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
const users: string[] = []
const now = new Date('2026-09-01T12:01:00Z')
let competencyId: string
let sceneVersionId: string

async function user() {
    const id = randomUUID()
    await db.user.create({ data: { id, clerkId: `adaptation-test-${id}`, email: `${id}@example.invalid` } })
    users.push(id)
    return id
}

before(async () => {
    const language = await db.language.upsert({ where: { code: 'es' }, update: {}, create: { code: 'es', name: 'Spanish', nativeName: 'Español' } })
    const course = await db.course.upsert({ where: { languageId_cefrLevel: { languageId: language.id, cefrLevel: 'Pre-A1' } }, update: { isPublished: true }, create: { languageId: language.id, cefrLevel: 'Pre-A1', title: 'Test course', isPublished: true } })
    const unit = await db.unit.upsert({ where: { courseId_orderIndex: { courseId: course.id, orderIndex: 0 } }, update: {}, create: { courseId: course.id, orderIndex: 0, title: 'Test unit' } })
    const competency = await db.competency.upsert({ where: { code: 'PA1.SOC.GRT.01' }, update: {}, create: { code: 'PA1.SOC.GRT.01', unitId: unit.id, title: 'Greeting', canDo: 'Greet someone', domain: 'SOC', level: 'Pre-A1', orderIndex: 0 } })
    competencyId = competency.id
    if (!await db.learningExperience.findFirst({ where: { competencyId, type: 'STORY' } })) await db.learningExperience.create({ data: { competencyId, type: 'STORY', title: 'Greetings' } })
    sceneVersionId = (await seedGolden(db))[0]
})

after(async () => {
    await db.user.deleteMany({ where: { id: { in: users } } })
    await db.$disconnect()
})

test('plan is evidence-weighted, explainable, replayable and immutable', async () => {
    const userId = await user()
    const attempt = await db.learningAttempt.create({ data: {
        userId, competencyId, sceneVersionId, idempotencyKey: randomUUID(), status: 'completed', sequence: 4,
        snapshot: { reviewed: true, definition: { contextFingerprint: 'test-context', purpose: 'practice' } },
        startedAt: new Date(now.getTime() - 3600000), completedAt: new Date(now.getTime() - 3500000), expiresAt: new Date(now.getTime() + 3600000),
    } })
    await db.attemptResponse.createMany({ data: [
        { attemptId: attempt.id, sequence: 0, responseKey: randomUUID(), answer: 'wrong', correct: false, dimension: 'comprehension', supported: false, evaluatorVersion: 'test/1', observedAt: new Date(now.getTime() - 3500000) },
        { attemptId: attempt.id, sequence: 1, responseKey: randomUUID(), answer: 'wrong', correct: false, dimension: 'retrieval', supported: true, evaluatorVersion: 'test/1', observedAt: new Date(now.getTime() - 3400000) },
        { attemptId: attempt.id, sequence: 2, responseKey: randomUUID(), answer: 'hola', correct: true, dimension: 'production', supported: false, evaluatorVersion: 'test/1', observedAt: new Date(now.getTime() - 3300000) },
    ] })
    await db.learnerEvent.create({ data: { userId, competencyId, type: 'confidence', payload: { level: 4, source: 'self_report' }, createdAt: new Date(now.getTime() - 1000) } })

    const service = new AdaptationService(db, () => now)
    const plan = await service.plan(userId)
    assert.equal(plan.placement.band, 'foundation')
    assert.equal(plan.confidenceCalibration.state, 'overconfident')
    assert.ok(plan.repairPlan.some(item => item.error === 'comprehension_gap'))
    assert.ok(plan.repairPlan.some(item => item.error === 'repair_gap'))
    assert.equal(plan.actions[0].kind, 'repair')
    assert.match(plan.actions[0].reason, /meaning|retrieval|response|interaction|repetition/i)
    assert.ok(plan.actions[0].evidence.some(row => /weighted accuracy/.test(row)))
    assert.deepEqual(await service.plan(userId), plan)
    const stored = await db.learnerPlanSnapshot.findFirstOrThrow({ where: { userId } })
    await assert.rejects(db.learnerPlanSnapshot.update({ where: { id: stored.id }, data: { version: 'tampered' } }), /immutable/)
})

test('without authoritative evidence the learner remains unplaced and receives unique open actions', async () => {
    const userId = await user()
    const plan = await new AdaptationService(db, () => now).plan(userId)
    assert.equal(plan.placement.band, 'unplaced')
    assert.equal(plan.confidenceCalibration.state, 'unmeasured')
    assert.equal(new Set(plan.actions.map(row => row.competencyId ?? row.kind)).size, plan.actions.length)
    assert.ok(plan.actions.every(row => row.evidence.length > 0))
})
