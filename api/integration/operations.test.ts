import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, test } from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PostgresRateLimitStore } from '../src/lib/rateLimit'
import { deleteLearningData, exportLearningData } from '../src/privacy/service'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Set TEST_DATABASE_URL to localhost:55439/ecla_phase1_test only')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
const users: string[] = []
after(async () => { await db.characterMemory.deleteMany({ where: { userId: { in: users } } }); await db.learnerEvent.deleteMany({ where: { userId: { in: users } } }); await db.user.deleteMany({ where: { id: { in: users } } }); await db.rateLimitBucket.deleteMany({ where: { key: { startsWith: 'operation-test:' } } }); await db.$disconnect() })

test('PostgreSQL rate buckets count concurrent requests atomically', async () => {
    const store = new PostgresRateLimitStore(db); const key = `operation-test:${randomUUID()}`; const start = new Date('2026-09-02T00:00:00Z'); const expiry = new Date('2026-09-03T00:00:00Z')
    const counts = await Promise.all(Array.from({ length: 20 }, () => store.consume(key, start, expiry)))
    assert.deepEqual(counts.sort((a,b) => a-b), Array.from({ length: 20 }, (_, index) => index + 1))
    assert.equal((await db.rateLimitBucket.findUniqueOrThrow({ where: { key } })).count, 20)
})

test('privacy export is complete and deletion clears learning data while retaining a reset identity', async () => {
    const id = randomUUID(); users.push(id)
    const user = await db.user.create({ data: { id, clerkId: `privacy-${id}`, email: `${id}@example.invalid`, xpTotal: 90, displayName: 'Learner', onboardingCompleted: true } })
    await db.learnerEvent.create({ data: { userId: id, type: 'confidence', payload: { level: 3 } } })
    await db.characterMemory.create({ data: { userId: id, characterId: 'marta', encounters: 2 } })
    const exported = await exportLearningData(db, user)
    assert.equal(exported.contract, 'ecla.privacy-export/1'); assert.equal(exported.events.length, 1); assert.equal(exported.memories.length, 1)
    await deleteLearningData(db, user)
    assert.equal(await db.learnerEvent.count({ where: { userId: id } }), 0); assert.equal(await db.characterMemory.count({ where: { userId: id } }), 0)
    const reset = await db.user.findUniqueOrThrow({ where: { id } }); assert.equal(reset.xpTotal, 0); assert.equal(reset.displayName, null); assert.equal(reset.onboardingCompleted, false)
})
