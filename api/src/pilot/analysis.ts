import { PILOT_REPORT_CONTRACT, type CalibrationRow, type PilotReport } from '../../../packages/contracts/pilot'

type Study = { slug: string; status: string; protocolVersion: string; durationWeeks: number; targetMin: number; targetMax: number }
type Participant = { status: string; consentedAt: Date | null }
type Measurement = { kind: string; competencyCode: string | null; situationId: string | null; predictedMastery: number | null; observedPerformance: number }

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
const rounded = (value: number | null) => value === null ? null : Math.round(value * 10_000) / 10_000

export function buildPilotReport(study: Study, participants: Participant[], measurements: Measurement[], interviewCount: number, generatedAt = new Date()): PilotReport {
  const rows: CalibrationRow[] = measurements
    .filter((row): row is Measurement & { predictedMastery: number } => row.predictedMastery !== null)
    .map(row => ({ competencyCode: row.competencyCode, situationId: row.situationId, predictedMastery: row.predictedMastery, observedPerformance: row.observedPerformance, absoluteError: Math.abs(row.predictedMastery - row.observedPerformance) }))
  const invited = participants.length
  const consented = participants.filter(row => row.consentedAt).length
  const active = participants.filter(row => row.status === 'active').length
  const withdrawn = participants.filter(row => row.status === 'withdrawn').length
  const predictions = rows.map(row => row.predictedMastery)
  const observed = rows.map(row => row.observedPerformance)
  const errors = rows.map(row => row.predictedMastery - row.observedPerformance)
  const agreements = rows.map(row => Number((row.predictedMastery >= .7) === (row.observedPerformance >= .7)))
  const externalAssessments = measurements.filter(row => row.kind === 'external_speaking').length
  const ultimateSituations = measurements.filter(row => row.kind === 'ultimate_situation').length
  const delayedRetentionTests = measurements.filter(row => row.kind === 'delayed_retention').length
  const blockers: string[] = []
  if (consented < study.targetMin) blockers.push(`At least ${study.targetMin} consented true beginners are required; ${consented} recorded.`)
  if (study.durationWeeks < 6 || study.durationWeeks > 8) blockers.push('The protocol must run for six to eight weeks.')
  if (interviewCount < consented * study.durationWeeks) blockers.push('Weekly interview coverage is incomplete.')
  if (externalAssessments < consented * 2) blockers.push('Independent baseline and post-pilot speaking assessments are incomplete.')
  if (ultimateSituations < consented * 5) blockers.push('At least five Ultimate Test situation observations per consented participant are required.')
  if (delayedRetentionTests < consented) blockers.push('Delayed retention observations are incomplete.')
  if (!rows.length) blockers.push('No predicted-mastery and observed-performance pairs are available for calibration.')

  return {
    contract: PILOT_REPORT_CONTRACT,
    study: { slug: study.slug, status: study.status, protocolVersion: study.protocolVersion, durationWeeks: study.durationWeeks },
    enrollment: { invited, consented, active, withdrawn, targetMin: study.targetMin, targetMax: study.targetMax },
    completeness: { weeklyInterviews: interviewCount, externalAssessments, ultimateSituations, delayedRetentionTests },
    calibration: { pairedObservations: rows.length, meanAbsoluteError: rounded(mean(rows.map(row => row.absoluteError))), meanPrediction: rounded(mean(predictions)), meanObservedPerformance: rounded(mean(observed)), overPrediction: rounded(mean(errors)), thresholdAgreement: rounded(mean(agreements)), rows },
    blockers,
    generatedAt: generatedAt.toISOString(),
  }
}
