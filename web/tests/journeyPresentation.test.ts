import assert from 'node:assert/strict'
import test from 'node:test'
import { JOURNEY_UNIT_ARTWORK, journeyUnitArtwork } from '../src/lib/journeyPresentation'

test('every published Pre-A1 unit has a unique semantic image', () => {
    const titles = [
        'Sound & Orientation',
        'First Contact',
        'Me',
        'My Immediate World',
        'Basic Needs',
        'Everyday Survival',
        'Interaction & Repair',
        'Mini Real Life',
        'Pre-A1 Gateway',
    ]
    const artwork = titles.map((title, index) => journeyUnitArtwork(title, index))
    assert.equal(Object.keys(JOURNEY_UNIT_ARTWORK).length, titles.length)
    assert.equal(new Set(artwork.map(item => item.src)).size, titles.length)
    assert.ok(artwork.every(item => item.src.startsWith('/worlds/journey/unit-') && item.src.endsWith('.webp')))
    assert.ok(artwork.every(item => item.alt.length > 30))
})

test('unknown future units receive a stable valid fallback', () => {
    assert.deepEqual(journeyUnitArtwork('Future unit', 3), journeyUnitArtwork('Future unit', 3))
    assert.match(journeyUnitArtwork('Future unit', 3).src, /^\/worlds\/journey\/unit-.+\.webp$/)
})
