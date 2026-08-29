import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateMasteryLevel, experienceEngagementLevel } from '../src/lib/masteryEngine'

describe('masteryEngine', () => {
    it('experience completion never promotes beyond DEVELOPING', () => {
        assert.equal(experienceEngagementLevel('NOT_STARTED', true), 'EXPOSED')
        assert.equal(experienceEngagementLevel('EXPOSED', true), 'DEVELOPING')
        assert.equal(experienceEngagementLevel('CONTROLLED', true), 'CONTROLLED')
        assert.equal(experienceEngagementLevel('TRANSFERRED', true), 'TRANSFERRED')
    })

    it('TRANSFERRED requires evidence ladder criteria', () => {
        const level = evaluateMasteryLevel({
            currentLevel: 'CONTROLLED',
            comprehension: 75,
            production: 70,
            retrieval: 50,
            transfer: 65,
            contextsCount: 2,
            repairsCompleted: 1,
            delayed: false,
        })
        assert.equal(level, 'TRANSFERRED')
    })

    it('cannot jump to TRANSFERRED without repair evidence', () => {
        const level = evaluateMasteryLevel({
            currentLevel: 'CONTROLLED',
            comprehension: 90,
            production: 90,
            retrieval: 90,
            transfer: 90,
            contextsCount: 3,
            repairsCompleted: 0,
            delayed: false,
        })
        assert.equal(level, 'CONTROLLED')
    })
})
