import assert from 'node:assert/strict'
import test from 'node:test'
import { homeAtmosphereFor, homePeriodForHour } from '../src/lib/homeAtmosphere'

test('Home atmosphere follows local-time boundaries without gaps', () => {
  assert.equal(homePeriodForHour(0), 'night')
  assert.equal(homePeriodForHour(4), 'night')
  assert.equal(homePeriodForHour(5), 'morning')
  assert.equal(homePeriodForHour(11), 'morning')
  assert.equal(homePeriodForHour(12), 'day')
  assert.equal(homePeriodForHour(16), 'day')
  assert.equal(homePeriodForHour(17), 'evening')
  assert.equal(homePeriodForHour(20), 'evening')
  assert.equal(homePeriodForHour(21), 'night')
  assert.equal(homePeriodForHour(23), 'night')
})

test('Home atmosphere has one optimized asset and aligned greeting per period', () => {
  const morning = homeAtmosphereFor(new Date(2026, 0, 1, 6))
  const day = homeAtmosphereFor(new Date(2026, 0, 1, 13))
  const evening = homeAtmosphereFor(new Date(2026, 0, 1, 18))
  const night = homeAtmosphereFor(new Date(2026, 0, 1, 22))

  assert.deepEqual(
    [morning.period, day.period, evening.period, night.period],
    ['morning', 'day', 'evening', 'night'],
  )
  assert.equal(new Set([morning.src, day.src, evening.src, night.src]).size, 4)
  for (const atmosphere of [morning, day, evening, night]) {
    assert.match(atmosphere.src, /^\/worlds\/spanish-.+\.webp$/)
    assert.ok(atmosphere.greeting.length > 0)
  }
})

test('invalid hours use the safe daytime fallback', () => {
  assert.equal(homePeriodForHour(-1), 'day')
  assert.equal(homePeriodForHour(24), 'day')
  assert.equal(homePeriodForHour(Number.NaN), 'day')
})
