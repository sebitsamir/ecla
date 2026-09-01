import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileScene, migrateSceneSource } from '../src/scenes/compiler'
import { isSceneDelivery } from '../../packages/contracts/scene'
export const sampleScene = {
    contract: 'ecla.scene/1', schemaVersion: 1, slug: 'compiler-test', competencyCode: 'PA1.SOC.GRT.01', title: 'Test',
    setting: 'Morning doorway', objective: 'Greet someone', contextFingerprint: 'compiler-test', purpose: 'practice', experiment: null,
    steps: [{ id: 'hello', stage: 'ENCOUNTER', kind: 'encounter', prompt: 'Listen', line: 'Hola', audio: { status: 'tts_fallback', locale: 'es-ES', rate: 0.9 } }],
}
test('canonical compiler hashes normalized content independently of object key order', () => {
    const original = compileScene(sampleScene)
    const reordered = compileScene(Object.fromEntries(Object.entries(sampleScene).reverse()))
    assert.equal(original.version, reordered.version)
    assert.notEqual(original.version, compileScene({ ...sampleScene, title: 'Changed' }).version)
    assert.notEqual(original.version, compileScene({ ...sampleScene, experiment: { key: 'pace', variant: 'slow' } }).version)
    assert.ok(isSceneDelivery({ revisionId: 'test', version: original.version, document: original.document }))
})
test('source validation rejects private evaluation keys, unknown contracts and duplicate tasks', () => {
    for (const invalid of [
        { ...sampleScene, assessment: { accepted: ['hola'] } },
        { ...sampleScene, contract: 'unknown' },
        { ...sampleScene, steps: [sampleScene.steps[0], sampleScene.steps[0]] },
        { ...sampleScene, steps: [{ ...sampleScene.steps[0], accepted: ['hola'] }] },
        { ...sampleScene, steps: [{ ...sampleScene.steps[0], kind: 'choice' }] },
    ]) assert.throws(() => compileScene(invalid), /Invalid scene/)
})
test('v0 migration is explicit and fails on unsupported schema without mutating input', () => {
    const { contract, setting, experiment, ...fields } = sampleScene
    const old = { ...fields, schemaVersion: 0, environment: setting }
    const source = migrateSceneSource(old)
    assert.equal(source.setting, setting); assert.equal(old.schemaVersion, 0)
    assert.equal(compileScene(source).version, compileScene(sampleScene).version)
    assert.throws(() => migrateSceneSource({ ...old, schemaVersion: 99 }))
})
test('public parser refuses malformed delivery instead of permitting local fallback', () => {
    for (const value of [null, {}, { revisionId: 'x', version: 'y', document: { contract: 'ecla.scene/2' } }]) assert.equal(isSceneDelivery(value), false)
    const document = compileScene(sampleScene).document
    assert.equal(isSceneDelivery({ revisionId: 'x', version: 'y', document: { ...document, steps: [{ ...document.steps[0], kind: 'choice', options: null }] } }), false)
})
