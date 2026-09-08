import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchHome, invalidateHomeCache, type LearnerHome } from '../src/lib/summary'

class MemoryStorage implements Storage {
    private values = new Map<string, string>()
    get length() { return this.values.size }
    clear() { this.values.clear() }
    getItem(key: string) { return this.values.get(key) ?? null }
    key(index: number) { return [...this.values.keys()][index] ?? null }
    removeItem(key: string) { this.values.delete(key) }
    setItem(key: string, value: string) { this.values.set(key, value) }
}

const home = (name: string) => ({ summary: { name } }) as unknown as LearnerHome

test('home cache is account-scoped and coalesces concurrent requests', async () => {
    const originalFetch = globalThis.fetch
    const originalWindow = globalThis.window
    const originalStorage = globalThis.sessionStorage
    Object.defineProperty(globalThis, 'window', { configurable: true, value: globalThis })
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: new MemoryStorage() })
    let calls = 0
    globalThis.fetch = async () => { calls += 1; await new Promise(resolve => setTimeout(resolve, 5)); return Response.json(home(`learner-${calls}`)) }

    try {
        invalidateHomeCache()
        const [first, duplicate] = await Promise.all([
            fetchHome(async () => 'token-a', { userId: 'user-a' }),
            fetchHome(async () => 'token-a', { userId: 'user-a' }),
        ])
        assert.equal(calls, 1)
        assert.equal(first.summary.name, duplicate.summary.name)
        const other = await fetchHome(async () => 'token-b', { userId: 'user-b' })
        assert.equal(calls, 2)
        assert.notEqual(other.summary.name, first.summary.name)
        await fetchHome(async () => 'token-a', { userId: 'user-a' })
        assert.equal(calls, 2)
    } finally {
        globalThis.fetch = originalFetch
        Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: originalStorage })
    }
})
