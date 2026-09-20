import assert from 'node:assert/strict'
import test from 'node:test'
import { PRE_A1_REGISTRY, validatePreA1Registry } from '../prisma/content/spanish/pre-a1/registry'
import { dryRunCurriculumMigration, validateMigrationManifest } from '../prisma/content/spanish/pre-a1/migration-manifest'

test('the reconciled registry preserves 44 IDs and adds the exact 16 new IDs', () => {
    assert.deepEqual(validatePreA1Registry(), { passed: true, errors: [] })
    assert.equal(PRE_A1_REGISTRY.length, 60)
    assert.equal(PRE_A1_REGISTRY.filter(item => item.status === 'retained').length, 44)
    assert.equal(PRE_A1_REGISTRY.filter(item => item.status === 'new').length, 16)
})

test('the migration manifest is source-qualified and fails closed for ambiguous evidence', () => {
    assert.deepEqual(validateMigrationManifest(), { passed: true, errors: [] })
    const ambiguous = dryRunCurriculumMigration([{ code: 'PA1.PER.IDN.01' }])
    assert.equal(ambiguous.safeToApply, false)
    assert.match(ambiguous.reviewRequired[0].reason, /automatic migration is forbidden/)
    const draft = dryRunCurriculumMigration([{ source:'portfolio', sourceVersion:'pre-a1-portfolio/1', code:'PA1.PER.IDN.01', meaning:'state a role', facets:['production'] }])
    assert.equal(draft.safeToApply, true)
    assert.equal(draft.mapped[0].mapping.destinationCode, 'PA1.PER.ROL.01')
})
