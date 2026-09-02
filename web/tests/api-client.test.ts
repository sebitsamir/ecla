import assert from 'node:assert/strict'
import test from 'node:test'

import { apiFetch } from '../src/lib/apiClient'

test('waits for Clerk to expose the first session token', async () => {
    const originalFetch = globalThis.fetch
    let tokenCalls = 0
    let authorization = ''

    globalThis.fetch = async (_input, init) => {
        authorization = new Headers(init?.headers).get('Authorization') ?? ''
        return Response.json({ ready: true })
    }

    try {
        const result = await apiFetch<{ ready: boolean }>('/ready', async () => {
            tokenCalls += 1
            return tokenCalls === 1 ? null : 'session-token'
        })

        assert.deepEqual(result, { ready: true })
        assert.equal(tokenCalls, 2)
        assert.equal(authorization, 'Bearer session-token')
    } finally {
        globalThis.fetch = originalFetch
    }
})

test('refreshes the Clerk token once after a first-load 401', async () => {
    const originalFetch = globalThis.fetch
    const tokenOptions: Array<{ skipCache?: boolean } | undefined> = []
    const authorizations: string[] = []

    globalThis.fetch = async (_input, init) => {
        authorizations.push(new Headers(init?.headers).get('Authorization') ?? '')
        return authorizations.length === 1
            ? new Response(null, { status: 401 })
            : Response.json({ ready: true })
    }

    try {
        const result = await apiFetch<{ ready: boolean }>('/ready', async options => {
            tokenOptions.push(options)
            return options?.skipCache ? 'fresh-token' : 'cached-token'
        })

        assert.deepEqual(result, { ready: true })
        assert.deepEqual(authorizations, ['Bearer cached-token', 'Bearer fresh-token'])
        assert.deepEqual(tokenOptions, [undefined, { skipCache: true }])
    } finally {
        globalThis.fetch = originalFetch
    }
})
