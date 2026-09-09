import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyAuthRoute } from '../src/lib/authRouting'

test('classifies learner screens as pages so stale sessions redirect instead of returning 404', () => {
    for (const pathname of ['/dashboard', '/course', '/learn/competency-1', '/review', '/progress']) {
        assert.equal(classifyAuthRoute(pathname), 'page')
    }
})

test('keeps public and service authentication behavior separate', () => {
    assert.equal(classifyAuthRoute('/'), 'public')
    assert.equal(classifyAuthRoute('/sign-in/factor-one'), 'public')
    assert.equal(classifyAuthRoute('/api/v1/health'), 'public')
    assert.equal(classifyAuthRoute('/api/v1/learner/home'), 'service')
    assert.equal(classifyAuthRoute('/trpc/learner.home'), 'service')
})
