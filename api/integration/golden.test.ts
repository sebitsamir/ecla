import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import type { Server } from 'node:http'
import { GoldenService } from '../src/golden/service'
import { seedGolden } from '../src/golden/seed'
import { GOLDEN_SCENES } from '../src/golden/curriculum'
import { DAY_MS } from '../src/golden/definition'
import { createAttemptRouter } from '../src/routes/attempts'
import type { GoldenAttempt } from '../../packages/contracts/golden'

// Deliberately refuse the application's DATABASE_URL and non-test destinations.
const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Set TEST_DATABASE_URL to localhost:55439/ecla_phase1_test only')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
let versions: string[] = []
const users: string[] = []
let now = new Date('2026-01-01T12:00:00Z')
const service = new GoldenService(db, () => now)
const otherServer = new GoldenService(db, () => now)
let server: Server
let origin: string
let httpUser: string

async function user(xpTotal = 0) {
    const id = randomUUID()
    await db.user.create({ data: { id, clerkId: `golden-test-${id}`, email: `${id}@example.invalid`, xpTotal } })
    users.push(id)
    return id
}
async function answerAll(owner: string, attempt: GoldenAttempt, index: number, wrong = false) {
    for (let sequence = attempt.sequence; sequence < GOLDEN_SCENES[index].definition.steps.length; sequence++) {
        const step = GOLDEN_SCENES[index].definition.steps[sequence]
        await service.respond(owner, attempt.id, { sequence, responseKey: randomUUID(), answer: step.kind === 'encounter' ? 'continue' : wrong ? 'wrong' : step.accepted[0] })
    }
}
async function finish(owner: string, index: number, wrong = false) {
    const attempt = await service.start(owner, versions[index], randomUUID())
    await answerAll(owner, attempt, index, wrong)
    return service.complete(owner, attempt.id)
}

before(async () => {
    const language = await db.language.upsert({ where: { code: 'es' }, update: {}, create: { code: 'es', name: 'Spanish', nativeName: 'Español' } })
    const course = await db.course.upsert({ where: { languageId_cefrLevel: { languageId: language.id, cefrLevel: 'Pre-A1' } }, update: {}, create: { languageId: language.id, cefrLevel: 'Pre-A1', title: 'Test course' } })
    const unit = await db.unit.upsert({ where: { courseId_orderIndex: { courseId: course.id, orderIndex: 0 } }, update: {}, create: { courseId: course.id, orderIndex: 0, title: 'Test unit' } })
    const competency = await db.competency.upsert({ where: { code: 'PA1.SOC.GRT.01' }, update: {}, create: { code: 'PA1.SOC.GRT.01', unitId: unit.id, title: 'Greeting', canDo: 'Greet someone', domain: 'SOC', level: 'Pre-A1', orderIndex: 0 } })
    if (!await db.learningExperience.findFirst({ where: { competencyId: competency.id, type: 'STORY' } })) await db.learningExperience.create({ data: { competencyId: competency.id, type: 'STORY', title: 'Greetings' } })
    versions = await seedGolden(db)
    assert.deepEqual(await seedGolden(db), versions)
    httpUser = await user()
    const app = express()
    app.use(express.json())
    app.use(createAttemptRouter(service, async req => { if (req.headers.authorization !== 'Bearer integration-test') throw Object.assign(new Error('Unauthorized'), { statusCode: 401 }); return httpUser }))
    app.use((error: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error.statusCode ?? 500).json({ error: error.message }))
    server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    origin = `http://127.0.0.1:${address.port}`
})
after(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    await db.user.deleteMany({ where: { id: { in: users } } })
    await db.$disconnect()
})

test('real HTTP contract rejects unauthenticated calls, fabricated scores and foreign ownership', async () => {
    assert.equal((await fetch(`${origin}/api/v1/attempts/golden`)).status, 401)
    const headers = { Authorization: 'Bearer integration-test', 'Content-Type': 'application/json' }
    const bad = await fetch(`${origin}/api/v1/attempts/start`, { method: 'POST', headers, body: JSON.stringify({ sceneVersionId: versions[0], idempotencyKey: randomUUID(), score: 100 }) })
    assert.equal(bad.status, 400)
    assert.equal(await db.learningAttempt.count({ where: { userId: httpUser } }), 0)
    const attempt = await service.start(await user(), versions[0], randomUUID())
    assert.equal((await fetch(`${origin}/api/v1/attempts/${attempt.id}`, { headers })).status, 404)
    const owned = await service.start(httpUser, versions[0], randomUUID())
    const early = await fetch(`${origin}/api/v1/attempts/${owned.id}/complete`, { method: 'POST', headers, body: '{}' })
    assert.equal(early.status, 409)
    const injected = await fetch(`${origin}/api/v1/attempts/${owned.id}/responses`, { method: 'POST', headers, body: JSON.stringify({ sequence: 0, responseKey: randomUUID(), answer: 'continue', correct: true }) })
    assert.equal(injected.status, 400)
})
test('independent service instances serialize starts, responses and eight concurrent completions', async () => {
    const owner = await user()
    const key = randomUUID()
    const attempts = await Promise.all(Array.from({ length: 8 }, (_, i) => (i % 2 ? service : otherServer).start(owner, versions[0], i < 4 ? key : randomUUID())))
    assert.equal(new Set(attempts.map(item => item.id)).size, 1)
    const attempt = attempts[0]
    assert.equal('accepted' in attempt.step!, false)
    const raw = { sequence: 0, responseKey: randomUUID(), answer: 'continue' }
    await Promise.all([service.respond(owner, attempt.id, raw), otherServer.respond(owner, attempt.id, raw)])
    assert.equal(await db.attemptResponse.count({ where: { attemptId: attempt.id } }), 1)
    await assert.rejects(service.respond(owner, attempt.id, { ...raw, answer: 'changed' }), /different answer/)
    await assert.rejects(service.respond(owner, attempt.id, { ...raw, responseKey: randomUUID() }), /sequence/)
    await answerAll(owner, await otherServer.get(owner, attempt.id), 0)
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => (i % 2 ? service : otherServer).complete(owner, attempt.id)))
    results.forEach(result => assert.deepEqual(result, results[0]))
    assert.equal(results[0].xpAwarded, 10)
    assert.equal(results[0].masteryLevel, 'DEVELOPING')
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: owner } })).xpTotal, 10)
    assert.equal((await db.userExperienceProgress.findFirstOrThrow({ where: { userId: owner } })).attempts, 1)
    assert.equal((await db.competencyMastery.findFirstOrThrow({ where: { userId: owner } })).exposureCount, 1)
    assert.equal((await db.streakLog.findFirstOrThrow({ where: { userId: owner } })).lessonsDone, 1)
    assert.equal((await finish(owner, 0)).xpAwarded, 0)
})
test('a late database failure rolls back attempt, mastery, progress and XP together', async () => {
    const owner = await user(2147483647)
    const attempt = await service.start(owner, versions[0], randomUUID())
    await answerAll(owner, attempt, 0)
    await assert.rejects(service.complete(owner, attempt.id)) // PostgreSQL integer overflow at XP increment
    const stored = await db.learningAttempt.findUniqueOrThrow({ where: { id: attempt.id } })
    assert.equal(stored.status, 'active'); assert.equal(stored.result, null)
    assert.equal(await db.userExperienceProgress.count({ where: { userId: owner } }), 0)
    assert.equal(await db.competencyMastery.count({ where: { userId: owner } }), 0)
    assert.equal(await db.streakLog.count({ where: { userId: owner } }), 0)
    await db.user.update({ where: { id: owner }, data: { xpTotal: 0 } })
    assert.equal((await service.complete(owner, attempt.id)).xpAwarded, 10)
})
test('support prevents independent pass; attempt resumes with immutable snapshot and expires safely', async () => {
    const owner = await user()
    const attempt = await service.start(owner, versions[0], randomUUID())
    await service.respond(owner, attempt.id, { sequence: 0, responseKey: randomUUID(), answer: 'continue' })
    const supported = await service.support(owner, attempt.id, 1)
    assert.ok(supported.support)
    assert.equal((await otherServer.get(owner, attempt.id)).sequence, 1)
    await answerAll(owner, supported, 0)
    const result = await service.complete(owner, attempt.id)
    assert.equal(result.passed, false); assert.equal(result.xpAwarded, 0)
    const fresh = await service.start(owner, versions[1], randomUUID())
    now = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    assert.equal((await service.get(owner, fresh.id)).status, 'expired')
    await assert.rejects(service.complete(owner, fresh.id), /no longer active/)
    assert.notEqual((await service.start(owner, versions[1], randomUUID())).id, fresh.id)
})
test('three contexts, unseen transfer and delayed retrieval yield only provisional pilot stages', async () => {
    const owner = await user()
    await assert.rejects(service.start(owner, versions[3], randomUUID()), /three practice/)
    for (const index of [0, 1, 2]) await finish(owner, index)
    const transfer = await finish(owner, 3)
    assert.equal(transfer.provisionalLevel, 'TRANSFERRED'); assert.equal(transfer.masteryLevel, 'DEVELOPING')
    assert.equal(transfer.dimensions.retention, null)
    await assert.rejects(service.start(owner, versions[5], randomUUID()), /Retention opens/)
    now = new Date(Date.parse(transfer.nextReviewAt!))
    assert.equal((await service.get(owner, transfer.attemptId)).result?.provisionalLevel, 'TRANSFERRED')
    const retention = await finish(owner, 5)
    assert.equal(retention.provisionalLevel, 'RETAINED'); assert.equal(retention.masteryLevel, 'DEVELOPING')
    assert.equal(retention.promotionEligible, false)
    now = new Date(now.getTime() + DAY_MS)
    const failed = await finish(owner, 5, true)
    assert.notEqual(failed.provisionalLevel, 'RETAINED')
    assert.notEqual(failed.provisionalLevel, 'TRANSFERRED')
})

test('failed first attempt awards no XP; later independent success awards it once', async () => {
    const owner = await user()
    assert.equal((await finish(owner, 0, true)).xpAwarded, 0)
    assert.equal((await finish(owner, 0)).xpAwarded, 10)
    assert.equal((await finish(owner, 1)).xpAwarded, 0)
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: owner } })).xpTotal, 10)
})
test('opening an unfinished practice resets the delayed-retrieval eligibility window', async () => {
    const owner = await user()
    for (const index of [0, 1, 2, 3]) await finish(owner, index)
    now = new Date(now.getTime() + DAY_MS + 1000)
    await service.start(owner, versions[0], randomUUID())
    now = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    await assert.rejects(service.start(owner, versions[5], randomUUID()), /full day after/)
})
test('replaying an already seen transfer cannot restore a lost transfer claim', async () => {
    const owner = await user()
    for (const index of [0, 1, 2, 3]) await finish(owner, index)
    await finish(owner, 0, true)
    assert.notEqual((await finish(owner, 3)).provisionalLevel, 'TRANSFERRED')
    assert.equal((await finish(owner, 4)).provisionalLevel, 'TRANSFERRED')
})
