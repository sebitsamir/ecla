import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileRubric, evaluateRubric } from '../src/assessment/rubric'
const rubric = { contract: 'ecla.rubric/1', targetKey: 'gateway:stranger_intro', claim: 'text_functional', criteria: [{ id: 'greet', description: 'Learner greets their partner', matchAny: ['hola', 'buenas'], required: true }, { id: 'name', description: 'Learner shares a name', matchAny: ['me llamo', 'soy'], required: true }], minLearnerTurns: 2, requiresRepair: false, calibration: { sampleSize: 20, agreement: 0.8, population: 'Independent beginner review sample' } }
test('rubric compilation is stable, versioned, strict and cannot claim acoustics', () => {
    const first = compileRubric(rubric); const second = compileRubric(Object.fromEntries(Object.entries(rubric).reverse()))
    assert.equal(first.version, second.version)
    assert.notEqual(first.version, compileRubric({ ...rubric, calibration: { ...rubric.calibration, agreement: 0.81 } }).version)
    for (const invalid of [{ ...rubric, score: 100 }, { ...rubric, claim: 'spoken_functional' }, { ...rubric, criteria: [rubric.criteria[0], rubric.criteria[0]] }]) assert.throws(() => compileRubric(invalid), /Invalid rubric/)
})
test('functional evaluation needs required intents, enough partner turns and calibration', () => {
    const result = evaluateRubric(compileRubric(rubric).definition, ['Hola', 'Me llamo Ana'], 2, false)
    assert.equal(result.objectiveAchieved, true); assert.equal(result.autoQualifies, true); assert.equal(result.confidence, 0.8)
    assert.equal(evaluateRubric(compileRubric(rubric).definition, ['Hola'], 1, false).autoQualifies, false)
    assert.equal(evaluateRubric(compileRubric({ ...rubric, calibration: { ...rubric.calibration, sampleSize: 19 } }).definition, ['Hola', 'Me llamo Ana'], 2, false).autoQualifies, false)
})
test('repair requirement is observed from server-owned turns', () => {
    const repair = compileRubric({ ...rubric, requiresRepair: true }).definition
    assert.equal(evaluateRubric(repair, ['Hola', 'Me llamo Ana'], 2, false).autoQualifies, false)
    assert.equal(evaluateRubric(repair, ['Hola', 'Me llamo Ana'], 2, true).autoQualifies, true)
})
