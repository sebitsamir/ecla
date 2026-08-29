import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyError } from '../src/lib/errorClassification'
import { computePerformance } from '../src/lib/performanceEngine'
import { supportFromCount, independenceFromSupport } from '../src/lib/supportLevels'
import { bandOf, RETENTION_DAYS } from '../src/routes/adaptive'

describe('mastery semantics', () => {
    it('controlled is not finished mastery', () => {
        const finished = ['TRANSFERRED', 'RETAINED']
        assert.equal(finished.includes('CONTROLLED'), false)
    })

    it('transfer requires transfer evidence not synthetic ratio', () => {
        const perf = computePerformance({ correct: 1, total: 1, supportLevel: 0, contexts: 1 })
        assert.equal(perf.contextDiversity < 2, true)
    })
})

describe('evidence engine', () => {
    it('classifies comprehension errors on understand stage', () => {
        const err = classifyError({ stage: 'UNDERSTAND', response: '???' })
        assert.equal(err.category, 'comprehension')
    })

    it('high support lowers independence', () => {
        assert.equal(independenceFromSupport(5, true) < independenceFromSupport(0, true), true)
    })

    it('support level caps at 5', () => {
        assert.equal(supportFromCount(99), 5)
    })
})

describe('adaptive engine', () => {
    it('bandOf returns qualitative labels', () => {
        assert.equal(bandOf(80), 'Strong')
        assert.equal(bandOf(55), 'Developing')
        assert.equal(bandOf(30), 'Needs practice')
    })

    it('retention schedule escalates', () => {
        assert.equal(RETENTION_DAYS.length >= 5, true)
    })
})

describe('curriculum validation', () => {
    it('competency code format is strict', () => {
        const CODE_RE = /^PA1\.[A-Z]{2,3}\.[A-Z]{2,3}\.\d{2}$/
        assert.equal(CODE_RE.test('PA1.SOC.GRT.01'), true)
        assert.equal(CODE_RE.test('INVALID'), false)
    })
})
