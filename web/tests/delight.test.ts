import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sceneMood, speakerIdentity } from '../src/lib/scenePresentation'

test('scene presentation is deterministic across settings and accented speaker names', () => {
    assert.equal(sceneMood('Bogotá · neighborhood café · afternoon'), 'cafe')
    assert.equal(sceneMood('Madrid · community classroom'), 'classroom')
    assert.deepEqual(speakerIdentity('Lucía'), { name: 'Lucía', initial: 'L', id: 'lucia' })
})

test('offline worker excludes API and authentication traffic from its cache policy', () => {
    const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8')
    assert.match(source, /pathname\.startsWith\('\/api\/'\)/)
    assert.match(source, /pathname\.includes\('sign-'\)/)
    assert.doesNotMatch(source, /adaptation|learner\/home|Authorization/)
})

test('onboarding does not use a client-scored placement quiz', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'app', 'onboarding', 'page.tsx'), 'utf8')
    assert.doesNotMatch(source, /placementQuiz|quizScore|calculateLevel/)
    assert.doesNotMatch(source, /currentLevel:/)
    assert.match(source, /Evidence-based Pre-A1 start/)
    assert.match(source, /user\.onboardingCompleted/)
    assert.doesNotMatch(source, /user\.onboardingComplete\b/)
    assert.doesNotMatch(source, /Learning style|MODES\.map|How do you learn best/)
    assert.match(source, /There is no mode to manage before you begin/)
})
