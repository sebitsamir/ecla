import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPilotReport } from '../src/pilot/analysis'

const study = { slug: 'pre-a1-proof', status: 'running', protocolVersion: 'pilot/1', durationWeeks: 6, targetMin: 20, targetMax: 30 }

test('pilot report exposes missing real-world evidence instead of claiming proof', () => {
  const report = buildPilotReport(study, [{ status: 'active', consentedAt: new Date() }], [], 0, new Date('2026-09-02T00:00:00Z'))
  assert.equal(report.calibration.pairedObservations, 0)
  assert.ok(report.blockers.some(value => value.includes('20 consented')))
  assert.ok(report.blockers.some(value => value.includes('No predicted-mastery')))
})

test('pilot report measures prediction error and clears blockers only for complete evidence', () => {
  const participants = Array.from({ length: 20 }, () => ({ status: 'active', consentedAt: new Date() }))
  const measurements = participants.flatMap((_, participant) => [
    { kind: 'external_speaking', competencyCode: null, situationId: `baseline-${participant}`, predictedMastery: .2, observedPerformance: .3 },
    { kind: 'external_speaking', competencyCode: null, situationId: `post-${participant}`, predictedMastery: .8, observedPerformance: .7 },
    ...Array.from({ length: 5 }, (_, situation) => ({ kind: 'ultimate_situation', competencyCode: 'PA1.SOC.GRT.01', situationId: `${participant}-${situation}`, predictedMastery: .8, observedPerformance: .7 })),
    { kind: 'delayed_retention', competencyCode: 'PA1.SOC.GRT.01', situationId: `retention-${participant}`, predictedMastery: null, observedPerformance: .7 },
  ])
  const report = buildPilotReport(study, participants, measurements, 120)
  assert.equal(report.blockers.length, 0)
  assert.equal(report.calibration.pairedObservations, 140)
  assert.equal(report.calibration.meanAbsoluteError, .1)
  assert.equal(report.calibration.overPrediction, .0714)
})
