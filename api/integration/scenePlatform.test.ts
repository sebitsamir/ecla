import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import type { Server } from 'node:http'
import { ScenePlatform } from '../src/scenes/platform'
import { scenePlatformRouter } from '../src/routes/scenePlatform'
import { seedCanonicalScenes } from '../src/scenes/seed'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Only the isolated localhost:55439/ecla_phase1_test database is allowed')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
const platform = new ScenePlatform(db)
const second = new ScenePlatform(db)
const uid = randomUUID()
const slug = `platform-${randomUUID()}`
const input = {
    contract: 'ecla.scene/1', schemaVersion: 1, slug, competencyCode: 'PA1.SOC.GRT.01', title: 'Integration draft',
    setting: 'Morning doorway', objective: 'Greet someone', contextFingerprint: slug, purpose: 'practice',
    experiment: { key: 'greeting-pace', variant: 'slow' },
    steps: [{ id: 'hello', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'Listen', line: 'Hola', audio: { status: 'tts_fallback', locale: 'es-ES', rate: 0.7 } }],
}
let server: Server
let origin: string
before(async () => {
    // Curriculum fixture is provisioned by the Phase 1 suite; no real learner rows are read.
    if (!await db.competency.findUnique({ where: { code: input.competencyCode } })) throw new Error('Run the golden integration suite first to create test curriculum')
    await db.user.create({ data: { id: uid, clerkId: uid, email: `${uid}@example.invalid` } })
    const app = express(); app.use(express.json())
    app.use(scenePlatformRouter(platform, req => { if (req.headers.authorization !== 'Bearer test-admin') throw Object.assign(new Error('Forbidden'), { statusCode: 403 }); return 'test-editor' }, async () => uid))
    app.use((error: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error.statusCode ?? 500).json({ error: error.message }))
    server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
    const address = server.address(); assert.ok(address && typeof address !== 'string'); origin = `http://127.0.0.1:${address.port}`
})
after(async () => {
    if (server) await new Promise<void>(resolve => server.close(() => resolve()))
    await db.user.deleteMany({ where: { id: uid } })
    await db.$disconnect()
})
test('drafts stay private, are repeatable, and preview never writes learner evidence', async () => {
    const rows = await Promise.all([platform.draft('test-editor', input), second.draft('test-editor', input)])
    assert.equal(rows[0].id, rows[1].id)
    await assert.rejects(platform.delivery(slug), /No published/)
    const preview = await platform.preview(rows[0].id)
    assert.equal(preview.document.assessment, 'practice_only')
    assert.equal(preview.version, rows[0].version)
    assert.equal(await db.sceneVisit.count({ where: { userId: uid } }), 0)
    await assert.rejects(platform.publish('test-editor', rows[0].id, null), /Review/)
})
test('publication checks exact review, rejects stale writers and preserves old snapshots on rollback', async () => {
    const a = await platform.draft('test-editor', input)
    await platform.review('test-editor', a.id, 'Checked meaning, locale and practice-only scope')
    await platform.publish('test-editor', a.id, null)
    const b = await platform.draft('test-editor', { ...input, title: 'Version B' })
    const c = await platform.draft('test-editor', { ...input, title: 'Version C' })
    for (const row of [b, c]) await platform.review('test-editor', row.id, 'Checked changed title against scene tasks')
    const competing = await Promise.allSettled([platform.publish('test-editor', b.id, a.id), second.publish('test-editor', c.id, a.id)])
    assert.equal(competing.filter(result => result.status === 'fulfilled').length, 1)
    const current = await platform.delivery(slug)
    assert.notEqual(current.revisionId, a.id)
    assert.equal((await platform.preview(a.id)).document.title, input.title)
    await platform.publish('test-editor', a.id, current.revisionId)
    assert.equal((await platform.delivery(slug)).revisionId, a.id)
    const key = randomUUID()
    const visits = await Promise.all([platform.visit(uid, a.id, key), second.visit(uid, a.id, key)])
    assert.equal(visits[0].id, visits[1].id)
    assert.equal(visits[0].experimentKey, 'greeting-pace'); assert.equal(visits[0].variant, 'slow')
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: uid } })).xpTotal, 0)
    assert.equal(await db.competencyMastery.count({ where: { userId: uid } }), 0)
    await platform.unpublish('test-editor', a.id)
    await assert.rejects(platform.delivery(slug), /No published/)
    await assert.rejects(platform.visit(uid, a.id, randomUUID()), /publication changed/)
    assert.equal((await platform.visit(uid, a.id, key)).id, visits[0].id)
})
test('HTTP authoring always checks admin and strict publication payloads', async () => {
    const body = JSON.stringify(input)
    const headers = { 'Content-Type': 'application/json' }
    assert.equal((await fetch(`${origin}/api/v1/admin/scenes/drafts`, { method: 'POST', headers, body })).status, 403)
    const draft = await platform.draft('test-editor', { ...input, title: 'HTTP test' })
    assert.equal((await fetch(`${origin}/api/v1/admin/scene-revisions/${draft.id}/preview`)).status, 403)
    const response = await fetch(`${origin}/api/v1/admin/scene-revisions/${draft.id}/publish`, { method: 'POST', headers: { ...headers, Authorization: 'Bearer test-admin' }, body: JSON.stringify({ expectedRevisionId: null, reviewed: true }) })
    assert.equal(response.status, 400)
    assert.equal((await platform.list(slug)).find(row => row.id === draft.id)?.reviewedBy, null)
})
test('golden-to-canonical migration seeds three repeatable drafts without publishing reserved transfer scenes', async () => {
    const first = await seedCanonicalScenes(db)
    const second = await seedCanonicalScenes(db)
    assert.equal(first.length, 3)
    assert.deepEqual(first.map(row => row.id), second.map(row => row.id))
    for (const row of first) {
        assert.equal(row.reviewedBy, null)
        assert.equal(await db.scenePublication.findUnique({ where: { revisionId: row.id } }), null)
    }
})

test('database rejects rewriting an existing revision identity or source', async () => {
    const revision = await platform.draft('test-editor', { ...input, title: 'Immutable revision test' })
    await assert.rejects(db.sceneRevision.update({ where: { id: revision.id }, data: { source: { altered: true } } }), /immutable/)
    await assert.rejects(db.sceneRevision.update({ where: { id: revision.id }, data: { compiled: { altered: true } } }), /immutable/)
    assert.equal((await platform.preview(revision.id)).document.title, 'Immutable revision test')
})
