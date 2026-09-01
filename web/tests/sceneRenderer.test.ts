import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SceneRenderer } from '../src/components/scenes/SceneRenderer'
import type { SceneDelivery } from '../../packages/contracts/scene'
const delivery: SceneDelivery = {
    revisionId: 'test', version: 'hash', document: {
        contract: 'ecla.scene/1', schemaVersion: 1, compilerVersion: 'scene-compiler/1', slug: 'test',
        competencyCode: 'PA1.SOC.GRT.01', title: 'Server title', setting: 'Doorway', objective: 'Greet someone',
        purpose: 'practice', contextFingerprint: 'doorway', experiment: null, assessment: 'practice_only',
        steps: [{ id: 'one', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'Server prompt', line: '<script>bad()</script>', audio: { status: 'tts_fallback', locale: 'es-ES', rate: 0.9 } }],
    },
}
test('generic renderer uses server document, escapes text and labels practice-only scope', () => {
    const html = renderToStaticMarkup(createElement(SceneRenderer, { delivery, onExit: () => {} }))
    assert.match(html, /Server title/); assert.match(html, /Server prompt/)
    assert.match(html, /No XP, score or mastery/)
    assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>/)
    assert.match(html, /hash/)
})
test('author preview has distinct label and never claims learner evidence', () => {
    const html = renderToStaticMarkup(createElement(SceneRenderer, { delivery, preview: true, onExit: () => {} }))
    assert.match(html, /Author preview/); assert.match(html, /No XP, score or mastery/)
})
