import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import express from 'express'
import type { Server } from 'node:http'
import { PrismaClient } from '@prisma/client'
import { PortfolioReviewService } from '../src/portfolio/service'
import { portfolioReviewRouter } from '../src/routes/portfolioReviews'
import { ScenePlatform } from '../src/scenes/platform'
import { portfolioSceneSources } from '../src/scenes/preA1Portfolio'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Only the isolated localhost:55439/ecla_phase1_test database is allowed')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
const service = new PortfolioReviewService(db)
const platform = new ScenePlatform(db)
const code = 'PA1.SND.LST.01'
let server: Server; let origin: string
const reviewer = (name: string) => ({ Authorization: `Bearer ${name}`, 'Content-Type': 'application/json' })

before(async () => {
    if (!await db.competency.findUnique({ where: { code } })) throw new Error('Seed the isolated Pre-A1 test curriculum first')
    const app = express(); app.use(express.json()); app.use(portfolioReviewRouter(service, req => { const value = req.headers.authorization?.replace('Bearer ', ''); if (!value) throw Object.assign(new Error('Forbidden'), { statusCode: 403 }); return value }))
    app.use((error: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error.statusCode ?? 500).json({ error: error.message }))
    server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) }); const address = server.address(); assert.ok(address && typeof address !== 'string'); origin = `http://127.0.0.1:${address.port}`
})
after(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); await db.$disconnect() })

test('review API is admin-only, version-bound, idempotent and requires independent approvers', async () => {
    assert.equal((await fetch(`${origin}/api/v1/admin/pre-a1-portfolio`)).status, 403)
    const catalog = await (await fetch(`${origin}/api/v1/admin/pre-a1-portfolio`, { headers: reviewer('reviewer-a') })).json() as Awaited<ReturnType<PortfolioReviewService['catalog']>>
    const item = catalog.items.find(row => row.code === code); assert.ok(item)
    const cultural = { kind: 'cultural', decision: 'approved', expectedContentVersion: item.contentVersion, reviewerQualification: 'Cultural reviewer with regional teaching experience', note: 'Checked setting, register, privacy, and regional inclusivity against the review protocol.', requestKey: randomUUID() }
    const endpoint = `${origin}/api/v1/admin/pre-a1-portfolio/${code}/reviews`
    assert.equal((await fetch(endpoint, { method: 'POST', headers: reviewer('reviewer-a'), body: JSON.stringify({ ...cultural, expectedContentVersion: '0'.repeat(64) }) })).status, 409)
    const first = await fetch(endpoint, { method: 'POST', headers: reviewer('reviewer-a'), body: JSON.stringify(cultural) }); assert.equal(first.status, 200)
    const replay = await fetch(endpoint, { method: 'POST', headers: reviewer('reviewer-a'), body: JSON.stringify(cultural) }); assert.equal(replay.status, 200)
    const native = { kind: 'native_speaker', decision: 'approved', expectedContentVersion: item.contentVersion, reviewerQualification: 'Native Spanish speaker and language educator', note: 'Checked naturalness, variants, listening lines, and beginner-level language in every context.', requestKey: randomUUID() }
    assert.equal((await fetch(endpoint, { method: 'POST', headers: reviewer('reviewer-a'), body: JSON.stringify(native) })).status, 409)
    assert.equal((await fetch(endpoint, { method: 'POST', headers: reviewer('reviewer-b'), body: JSON.stringify({ ...native, requestKey: randomUUID() }) })).status, 200)
})

test('publication and learner delivery follow the latest persisted decisions', async () => {
    const catalog = await service.catalog(); const item = catalog.items.find(row => row.code === code); assert.ok(item); assert.deepEqual(item.blockers, [])
    const base = portfolioSceneSources().find(row => row.competencyCode === code); assert.ok(base)
    const slug = `review-workflow-${randomUUID()}`
    const revision = await platform.draft('reviewer-a', { ...base, slug, contextFingerprint: slug })
    await platform.review('reviewer-a', revision.id, 'Checked the exact scene revision after both independent portfolio approvals')
    await platform.publish('reviewer-a', revision.id, null)
    assert.equal((await platform.delivery(slug)).revisionId, revision.id)
    await service.decide('reviewer-c', code, { kind: 'cultural', decision: 'rejected', expectedContentVersion: item.contentVersion, reviewerQualification: 'Independent cultural and accessibility reviewer', note: 'Rejected after finding a cultural assumption that requires a documented editorial correction.', requestKey: randomUUID() })
    const decision = await db.portfolioReviewDecision.findFirstOrThrow({ where: { competencyCode: code }, orderBy: { createdAt: 'desc' } })
    await assert.rejects(db.portfolioReviewDecision.update({ where: { id: decision.id }, data: { note: 'Altered decision' } }), /append-only/)
    await assert.rejects(platform.delivery(slug), /cultural review is pending or rejected/)
    assert.equal((await platform.catalog()).some(row => row.slug === slug), false)
    await assert.rejects(platform.visit(randomUUID(), revision.id, randomUUID()), /cultural review is pending or rejected/)
})
