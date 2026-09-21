import assert from 'node:assert/strict'
import test from 'node:test'
import { deleteAccountSchema, learnerPreferencesSchema, profileSchema } from '../src/lib/schemas'

test('profile updates accept names but reject client-authored account fields', () => {
    assert.equal(profileSchema.safeParse({ firstName: 'Sebi', lastName: 'T' }).success, true)
    assert.equal(profileSchema.safeParse({ firstName: '', lastName: 'T' }).success, false)
    assert.equal(profileSchema.safeParse({ firstName: 'Sebi', lastName: 'T', email: 'other@example.com' }).success, false)
})

test('learning settings accept only supported motivations and daily paces', () => {
    assert.equal(learnerPreferencesSchema.safeParse({ motivation: 'TRAVEL', dailyGoalXp: 20 }).success, true)
    assert.equal(learnerPreferencesSchema.safeParse({ motivation: null, dailyGoalXp: 50 }).success, true)
    assert.equal(learnerPreferencesSchema.safeParse({ motivation: 'TRAVEL', dailyGoalXp: 75 }).success, false)
    assert.equal(learnerPreferencesSchema.safeParse({ motivation: 'OTHER', dailyGoalXp: 100 }).success, false)
})

test('account deletion requires the complete exact confirmation phrase', () => {
    assert.equal(deleteAccountSchema.safeParse({ confirmation: 'DELETE MY ACCOUNT' }).success, true)
    assert.equal(deleteAccountSchema.safeParse({ confirmation: 'delete my account' }).success, false)
    assert.equal(deleteAccountSchema.safeParse({ confirmation: 'DELETE MY ACCOUNT', force: true }).success, false)
})
