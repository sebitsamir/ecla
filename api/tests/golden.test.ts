import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { GOLDEN_SCENES } from '../src/golden/curriculum'
import { definitionSchema, gradeStep, publicStep, responseSchema, completeSchema, DAY_MS } from '../src/golden/definition'
import { availability, projectEvidence, type ObservedAttempt } from '../src/golden/evidence'

const observed = (index: number, extra: Partial<ObservedAttempt> = {}): ObservedAttempt => {
    const definition = GOLDEN_SCENES[index].definition
    return { definition, reviewed: false, contextNovel: true, retentionEligible: true, completedAt: new Date('2026-01-01'), responses: definition.steps.map(step => ({ dimension: step.dimension, correct: true, supported: false, repair: step.repair })), ...extra }
}
test('all six drafts validate and public steps omit evaluation keys and support models', () => {
    assert.equal(GOLDEN_SCENES.length, 6)
    for (const scene of GOLDEN_SCENES) {
        definitionSchema.parse(scene.definition)
        for (const step of scene.definition.steps) {
            const output = publicStep(step)
            for (const key of ['accepted', 'dimension', 'model', 'repair']) assert.equal(key in output, false)
        }
    }
    const invalid = structuredClone(GOLDEN_SCENES[0].definition)
    invalid.steps[1].id = invalid.steps[0].id
    assert.equal(definitionSchema.safeParse(invalid).success, false)
})
test('grading checks the complete response, tolerates punctuation/accents and rejects unrelated Spanish', () => {
    const step = GOLDEN_SCENES[0].definition.steps.find(step => step.id === 'retrieve')!
    assert.equal(gradeStep(step, ' ¡BUENOS dias! '), true)
    for (const answer of ['Buenas noches', 'hola porque si buenos dias no', 'banana', '']) assert.equal(gradeStep(step, answer), false)
    const choice = GOLDEN_SCENES[0].definition.steps[1]
    assert.equal(gradeStep(choice, 'greeting'), true)
    assert.equal(gradeStep(choice, 'Greeting you'), false)
})
test('requests reject client scores, fabricated context and review claims', () => {
    const raw = { sequence: 0, responseKey: randomUUID(), answer: 'hola' }
    assert.equal(responseSchema.safeParse(raw).success, true)
    for (const field of ['score', 'contextNovel', 'retentionEligible', 'passed', 'xp']) assert.equal(responseSchema.safeParse({ ...raw, [field]: 100 }).success, false)
    assert.equal(completeSchema.safeParse({}).success, true)
    assert.equal(completeSchema.safeParse({ score: 100 }).success, false)
})
test('transfer requires three independent contexts, novelty and repair; clock alone cannot retain', () => {
    const practices = [observed(0), observed(1), observed(2)]
    assert.equal(projectEvidence(practices).level, 'CONTROLLED')
    assert.equal(projectEvidence([...practices, observed(3, { contextNovel: false })]).level, 'CONTROLLED')
    const transferred = [...practices, observed(3)]
    assert.equal(projectEvidence(transferred).level, 'TRANSFERRED')
    assert.notEqual(availability(GOLDEN_SCENES[5].definition, transferred, new Date('2026-01-01')), null)
    assert.equal(availability(GOLDEN_SCENES[5].definition, transferred, new Date(Date.parse('2026-01-01') + DAY_MS)), null)
    assert.equal(projectEvidence(transferred).dimensions.retention, null)
    assert.equal(projectEvidence([...transferred, observed(5, { retentionEligible: false })]).level, 'TRANSFERRED')
    assert.equal(projectEvidence([...transferred, observed(5)]).level, 'RETAINED')
})
test('assistance is not independent evidence and later failure lowers the previous claim', () => {
    const practices = [observed(0), observed(1), observed(2)]
    const assisted = observed(3)
    assisted.responses.forEach(response => { response.supported = true })
    assert.equal(projectEvidence([...practices, assisted]).level, 'CONTROLLED')
    const failed = observed(5)
    failed.responses.forEach(response => { response.correct = false })
    const projection = projectEvidence([...practices, observed(3), observed(5), failed])
    assert.notEqual(projection.level, 'RETAINED')
    assert.notEqual(projection.level, 'TRANSFERRED')
    assert.equal(projection.dimensions.retention, 60)
})
