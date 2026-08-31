import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GoldenResultPanel } from '../src/components/golden/GoldenResultPanel'
import type { GoldenResult } from '../../packages/contracts/golden'

const result: GoldenResult = {
    contract: 'golden-greeting/1', attemptId: 'test', passed: true, xpAwarded: 10,
    correct: 5, total: 5, provisionalLevel: 'CONTROLLED', masteryLevel: 'DEVELOPING',
    promotionEligible: false, nextReviewAt: null,
    explanation: 'Text-mediated pilot; recorded audio and educator review pending.',
    dimensions: { comprehension: 100, retrieval: 100, production: 100, interaction: 100, transfer: null, retention: null },
}
test('result distinguishes provisional performance from recorded mastery and unmeasured dimensions', () => {
    const html = renderToStaticMarkup(createElement(GoldenResultPanel, { result }))
    assert.match(html, /Educator review is pending/)
    assert.match(html, /not a fluency certification/)
    assert.match(html, /Recorded mastery: developing/)
    assert.equal((html.match(/Not assessed/g) ?? []).length, 2)
    assert.match(html, /10 XP/)
})
test('unsuccessful result never celebrates independent completion', () => {
    const html = renderToStaticMarkup(createElement(GoldenResultPanel, { result: { ...result, passed: false, xpAwarded: 0, correct: 2 } }))
    assert.match(html, /More practice will help/)
    assert.doesNotMatch(html, /tasks completed independently/)
    assert.match(html, /0 XP/)
})
