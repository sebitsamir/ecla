import assert from 'node:assert/strict'
import { test } from 'node:test'
import { onboardingSchema } from '../src/lib/schemas'

test('onboarding records preferences but rejects client-authored placement', () => {
    const preferences = { motivation: 'TRAVEL', preferredMode: 'IMMERSION', dailyGoalXp: 50 } as const
    assert.equal(onboardingSchema.safeParse(preferences).success, true)
    assert.equal(onboardingSchema.safeParse({ ...preferences, currentLevel: 'B1' }).success, false)
})
