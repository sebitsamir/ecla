import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { once } from 'node:events'
import { access } from 'node:fs/promises'
import { withTemporaryAudio } from '../src/lib/temporaryAudio'

describe('unverified assessment containment', () => {
    it('rejects fabricated and replayed requests without reaching a write handler', async () => {
        const app = express()
        app.use(express.json())
        // Import the actual route wiring. No auth, DB or AI calls are necessary
        // to reject these retired endpoints.
        process.env.GROQ_API_KEY ??= 'test-no-network'
        for (const routes of await Promise.all([
            import('../src/routes/learner'), import('../src/routes/lessons'),
            import('../src/routes/gateway'), import('../src/routes/missions'),
            import('../src/routes/performance'),
        ])) app.use(routes.default)
        const server = app.listen(0, '127.0.0.1')
        await once(server, 'listening')
        try {
            const address = server.address()
            assert.ok(address && typeof address !== 'string')
            const paths = [
                '/api/v1/lessons/complete', '/api/v1/learner/demonstrate',
                '/api/v1/evidence', '/api/v1/gateway/complete',
                '/api/v1/missions/forged/evaluate', '/api/v1/learner/performance',
            ]
            const responses = await Promise.all(paths.flatMap(path => Array.from({ length: 3 }, () => fetch(
                `http://127.0.0.1:${address.port}${path}/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correct: 100, evidence: { transfer: 100 }, sceneId: 'forged' }),
                },
            ))))
            for (const response of responses) {
                assert.equal(response.status, 409)
                assert.equal((await response.json()).code, 'VERIFIED_ATTEMPT_REQUIRED')
            }
        } finally {
            await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
        }
    })
})

describe('temporary audio lifecycle', () => {
    it('removes the recording after successful transcription', async () => {
        let path = ''
        const result = await withTemporaryAudio(Buffer.from('recording'), async stream => {
            path = String(stream.path)
            const chunks: Buffer[] = []
            for await (const chunk of stream) chunks.push(Buffer.from(chunk))
            assert.equal(Buffer.concat(chunks).toString(), 'recording')
            return 'hola'
        })
        assert.equal(result, 'hola')
        await assert.rejects(access(path), { code: 'ENOENT' })
    })

    it('removes the recording when the provider throws before consuming it', async () => {
        let path = ''
        await assert.rejects(withTemporaryAudio(Buffer.from('recording'), async stream => {
            path = String(stream.path)
            throw new Error('provider outage')
        }), /provider outage/)
        await assert.rejects(access(path), { code: 'ENOENT' })
    })

    it('isolates simultaneous recordings', async () => {
        const paths = await Promise.all(Array.from({ length: 10 }, () =>
            withTemporaryAudio(Buffer.from('recording'), async stream => String(stream.path)),
        ))
        assert.equal(new Set(paths).size, 10)
        for (const path of paths) await assert.rejects(access(path), { code: 'ENOENT' })
    })
})
