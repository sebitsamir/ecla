import assert from 'node:assert/strict'
import test from 'node:test'
import { PRE_A1_PORTFOLIO } from '../prisma/content/spanish/pre-a1/portfolio'
import { validatePreA1Portfolio } from '../prisma/content/spanish/pre-a1/portfolio-validation'
import { portfolioSceneSources } from '../src/scenes/preA1Portfolio'
import { PRE_A1_CODES } from '../prisma/content/spanish/pre-a1/codes'
import { PORTFOLIO_EXPERIMENT_KEY, portfolioContentVersion, portfolioReviewBlockers } from '../prisma/content/spanish/pre-a1/portfolio-version'

test('all 44 Pre-A1 competencies have explicit complete portfolios without duplicate contexts', () => {
    const report = validatePreA1Portfolio(PRE_A1_PORTFOLIO, PRE_A1_CODES)
    assert.equal(PRE_A1_PORTFOLIO.length, 44)
    assert.equal(PRE_A1_PORTFOLIO.reduce((sum, item) => sum + item.contexts.length, 0), 132)
    assert.deepEqual(report.errors, [])
    assert.equal(report.passed, true)
})

test('portfolio stays unpublished until independent cultural and native-speaker reviews exist', () => {
    const report = validatePreA1Portfolio(PRE_A1_PORTFOLIO, PRE_A1_CODES)
    assert.equal(report.publishable, false)
    assert.equal(report.reviewBlockers.length, 88)
})

test('every authored context compiles into a versioned canonical scene draft', () => {
    const sources = portfolioSceneSources()
    assert.equal(sources.length, 132)
    assert.equal(new Set(sources.map(source => source.slug)).size, 132)
    assert.equal(sources.filter(source => source.purpose === 'transfer').length, 44)
    for (const item of PRE_A1_PORTFOLIO) {
        const version = portfolioContentVersion(item)
        assert.equal(sources.find(source => source.competencyCode === item.code)?.experiment?.key, PORTFOLIO_EXPERIMENT_KEY)
        assert.equal(sources.find(source => source.competencyCode === item.code)?.experiment?.variant, version)
        assert.equal(portfolioReviewBlockers(item, version).length, 2)
    }
})
