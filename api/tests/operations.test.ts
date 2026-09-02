import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import express from 'express'
import { rateLimit, type RateLimitStore } from '../src/lib/rateLimit'
import { requestObservability } from '../src/lib/observability'

test('rate limits expose standard headers and reject above the shared count', async () => {
    let count = 0
    const store: RateLimitStore = { consume: async () => ++count }
    const app = express(); app.use(requestObservability); app.use(rateLimit({ windowMs: 60_000, max: 2, keyPrefix: 'test' }, store, () => 120_000)); app.get('/', (_req, res) => res.json({ ok: true }))
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening')
    try {
        const address = server.address(); assert.ok(address && typeof address !== 'string'); const url = `http://127.0.0.1:${address.port}`
        const responses = [await fetch(url), await fetch(url), await fetch(url)]
        assert.deepEqual(responses.map(row => row.status), [200, 200, 429])
        assert.equal(responses[2].headers.get('ratelimit-limit'), '2'); assert.equal(responses[2].headers.get('retry-after'), '60')
        assert.match(responses[0].headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/i)
    } finally { await new Promise<void>(resolve => server.close(() => resolve())) }
})

test('request tracing preserves a valid upstream UUID and replaces unsafe input', async () => {
    const app = express(); app.use(requestObservability); app.get('/', (_req, res) => res.json({ requestId: res.locals.requestId }))
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening')
    try {
        const address = server.address(); assert.ok(address && typeof address !== 'string'); const url = `http://127.0.0.1:${address.port}`
        const id = '123e4567-e89b-42d3-a456-426614174000'
        assert.equal((await fetch(url, { headers: { 'x-request-id': id } })).headers.get('x-request-id'), id)
        assert.notEqual((await fetch(url, { headers: { 'x-request-id': 'attacker-controlled-value' } })).headers.get('x-request-id'), 'attacker-controlled-value')
    } finally { await new Promise<void>(resolve => server.close(() => resolve())) }
})
