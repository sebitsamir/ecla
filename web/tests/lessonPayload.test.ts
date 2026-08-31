import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractEngine } from '../src/lib/lessonPayload'
import { activityToBeats } from '../src/lib/activityRegistry'
import { UNIT1 } from '../src/lib/blueprint'

describe('curriculum JSON boundary', () => {
    it('does not crash the player on malformed or absent payloads', () => {
        for (const value of [null, undefined, 42, 'lesson', [], { subLessons: [null, false] }]) {
            assert.equal(extractEngine(value), null)
        }
    })

    it('filters invalid stages and non-string language targets without inventing evidence', () => {
        const engine = extractEngine({ subLessons: [{ type: 'STORY', content: {
            languageTargets: { examples: ['Hola.', 100, { score: 100 }], patterns: null },
            subLessons: [null, { stage: 'FAKE' }, {
                stage: ' RETRIEVE ', activities: [{ type: 'recall', input: null }],
            }],
        } }] })
        assert.ok(engine)
        assert.equal(engine.subLessons.length, 1)
        assert.equal(engine.subLessons[0].stage, 'RETRIEVE')
        assert.deepEqual(engine.languageTargets.examples, ['Hola.'])
        assert.deepEqual(engine.languageTargets.patterns, [])
        assert.equal(engine.assessment, undefined)
        const stage = engine.subLessons[0]
        const target = { words: [], patterns: [], examples: ['Hola.'] }
        const beats = activityToBeats(stage.activities[0], {
            bp: UNIT1[0], main: 'sofia', other: 'marta', gloss: () => undefined, t: target,
        }, stage, target)
        assert.equal(beats[0]?.kind, 'speak')
    })

    it('uses the selected experience instead of mixing targets across modes', () => {
        const makeContent = (text: string) => ({
            languageTargets: { examples: [text] }, subLessons: [{ stage: 'ENCOUNTER' }],
        })
        const lesson = { subLessons: [
            { type: 'STORY', content: makeContent('Hola.') },
            { type: 'IMMERSION', content: makeContent('Buenas tardes.') },
        ] }
        assert.deepEqual(extractEngine(lesson, 'IMMERSION')?.languageTargets.examples, ['Buenas tardes.'])
    })
})
