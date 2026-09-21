import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const runner = readFileSync(new URL('../src/components/assessment/AssessmentRunner.tsx', import.meta.url), 'utf8')
const gateway = readFileSync(new URL('../src/app/gateway/page.tsx', import.meta.url), 'utf8')

test('assessment experience keeps server-owned evidence and review boundaries visible', () => {
    assert.match(runner, /api\/v1\/assessment-sessions/)
    assert.match(runner, /Evaluation comes from saved turns on the server/)
    assert.match(runner, /qualified reviewer must confirm/)
    assert.match(runner, /transcript alone is not pronunciation evidence/)
    assert.doesNotMatch(runner, /Gateway passed.*autoQualifies/)
})

test('gateway is an immersive route with a safe auth redirect', () => {
    assert.match(gateway, /router\.replace\('\/'\)/)
    assert.match(gateway, /<AssessmentRunner kind="gateway"/)
    assert.doesNotMatch(gateway, /<AppShell>/)
})

test('mission and gateway remain distinct learner experiences', () => {
    assert.match(runner, /Take your Spanish into real life/)
    assert.match(runner, /Move through seven short, everyday conversations/)
    assert.match(runner, /session\.objective/)
    assert.match(runner, /session\.title/)
})
