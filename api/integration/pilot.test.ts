import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, test } from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PilotService } from '../src/pilot/service'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Set TEST_DATABASE_URL to localhost:55439/ecla_phase1_test only')
const db = new PrismaClient({ datasources: { db: { url: target.toString() } } })
const slug = `pilot-${randomUUID()}`
let userId = ''
after(async () => {
  const study = await db.pilotStudy.findUnique({ where: { slug } })
  if (study) { await db.pilotRevision.deleteMany({ where: { studyId: study.id } }); await db.pilotParticipant.deleteMany({ where: { studyId: study.id } }); await db.pilotStudy.delete({ where: { id: study.id } }) }
  if (userId) await db.user.deleteMany({ where: { id: userId } })
  await db.$disconnect()
})

test('pilot consent, locked prediction, outcome, and honest blockers persist', async () => {
  const service = new PilotService(db, () => new Date('2026-09-02T00:00:00Z'))
  const user = await db.user.create({ data: { clerkId: `pilot-${randomUUID()}`, email: `${randomUUID()}@example.invalid` } }); userId = user.id
  await service.create('admin:test', { slug, title: 'Pre-A1 proof pilot', protocolVersion: 'pilot/1', consentVersion: 'consent/1', consentTextHash: 'a'.repeat(64), targetMin: 20, targetMax: 30, durationWeeks: 6 })
  const participant = await service.invite('admin:test', slug, { userId, eligibilityInstrument: 'independent-screen/1' })
  await service.consent(userId, slug, 'consent/1')
  const prediction = await service.lockPrediction('admin:test', slug, participant.id, { situationId: 'stranger-introduction', modelVersion: 'mastery/1' })
  assert.equal(prediction.predictedMastery, 0)
  const requestKey = randomUUID()
  const input = { kind: 'ultimate_situation', situationId: 'stranger-introduction', predictionId: prediction.id, instrumentVersion: 'ultimate/1', observedPerformance: .75, assessorIndependent: true, evidenceReference: 'external://assessment-1', requestKey, observedAt: new Date('2026-09-02T01:00:00Z') }
  const outcome = await service.measurement('assessor:test', slug, participant.id, input)
  const replay = await service.measurement('assessor:test', slug, participant.id, input)
  assert.equal(replay.id, outcome.id)
  await assert.rejects(service.start('admin:test', slug), /20-30 consented/)
  const report = await service.report(slug)
  assert.equal(report.calibration.pairedObservations, 1)
  assert.ok(report.blockers.length > 0)
})
