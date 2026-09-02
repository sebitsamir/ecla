import { randomBytes } from 'node:crypto'
import type { Prisma, PrismaClient } from '@prisma/client'
import { AppError } from '../lib/errors'
import { buildPilotReport } from './analysis'

const json = (value: unknown) => value as Prisma.InputJsonValue
const participantCode = () => `P-${randomBytes(5).toString('hex').toUpperCase()}`

export class PilotService {
  constructor(private db: PrismaClient, private clock = () => new Date()) {}

  create(actor: string, input: { slug: string; title: string; protocolVersion: string; consentVersion: string; consentTextHash: string; targetMin: number; targetMax: number; durationWeeks: number }) {
    return this.db.pilotStudy.create({ data: { ...input, createdBy: actor } })
  }

  async invite(actor: string, slug: string, input: { userId: string; eligibilityInstrument: string }) {
    const study = await this.db.pilotStudy.findUnique({ where: { slug } })
    if (!study || study.status !== 'draft') throw new AppError('Pilot is not accepting invitations', 409)
    const user = await this.db.user.findUnique({ where: { id: input.userId }, select: { id: true } })
    if (!user) throw new AppError('Learner not found', 404)
    return this.db.pilotParticipant.create({ data: { studyId: study.id, userId: user.id, participantCode: participantCode(), beginnerVerifiedBy: actor, eligibilityInstrument: input.eligibilityInstrument } })
  }

  async consent(userId: string, slug: string, consentVersion: string) {
    const participant = await this.db.pilotParticipant.findFirst({ where: { userId, study: { slug } }, include: { study: true } })
    if (!participant) throw new AppError('Pilot invitation not found', 404)
    if (participant.status === 'withdrawn') throw new AppError('Pilot participation was withdrawn', 409)
    if (consentVersion !== participant.study.consentVersion) throw new AppError('Consent text changed; review the current consent form', 409)
    return this.db.pilotParticipant.update({ where: { id: participant.id }, data: { consentVersion, consentedAt: participant.consentedAt ?? this.clock(), status: 'active' }, select: { participantCode: true, status: true, consentedAt: true } })
  }

  async withdraw(userId: string, slug: string, reason?: string) {
    const participant = await this.db.pilotParticipant.findFirst({ where: { userId, study: { slug } } })
    if (!participant) throw new AppError('Pilot participation not found', 404)
    return this.db.pilotParticipant.update({ where: { id: participant.id }, data: { status: 'withdrawn', withdrawnAt: this.clock(), withdrawalReason: reason ?? null }, select: { participantCode: true, status: true, withdrawnAt: true } })
  }

  async start(actor: string, slug: string) {
    return this.db.$transaction(async tx => {
      const study = await tx.pilotStudy.findUnique({ where: { slug } })
      if (!study || study.status !== 'draft') throw new AppError('Pilot is not in draft status', 409)
      const consented = await tx.pilotParticipant.count({ where: { studyId: study.id, status: 'active', consentedAt: { not: null } } })
      if (consented < study.targetMin || consented > study.targetMax) throw new AppError(`Pilot requires ${study.targetMin}-${study.targetMax} consented participants`, 409)
      const started = await tx.pilotStudy.update({ where: { id: study.id }, data: { status: 'running', startedAt: this.clock() } })
      await tx.pilotRevision.create({ data: { studyId: study.id, actor, decision: 'pilot_started', rationale: `${consented} consented participants met the locked protocol cohort requirement.`, affectedVersions: json({ protocolVersion: study.protocolVersion, consentVersion: study.consentVersion }) } })
      return started
    })
  }

  async lockPrediction(actor: string, slug: string, participantId: string, input: { competencyCode?: string; situationId: string; modelVersion: string }) {
    const participant = await this.db.pilotParticipant.findFirst({ where: { id: participantId, study: { slug }, status: 'active', consentedAt: { not: null } } })
    if (!participant) throw new AppError('Active consented participant not found', 404)
    const scores = input.competencyCode
      ? await this.db.competencyMastery.findMany({ where: { userId: participant.userId, competency: { code: input.competencyCode } }, select: { overallScore: true } })
      : await this.db.competencyMastery.findMany({ where: { userId: participant.userId }, select: { overallScore: true } })
    const values = scores.flatMap(row => row.overallScore === null ? [] : [Math.max(0, Math.min(1, row.overallScore / 100))])
    const predictedMastery = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    return this.db.pilotPrediction.create({ data: { participantId, competencyCode: input.competencyCode, situationId: input.situationId, modelVersion: input.modelVersion, predictedMastery, evidenceCutoffAt: this.clock(), lockedBy: actor } })
  }

  async measurement(actor: string, slug: string, participantId: string, input: { kind: string; week?: number; competencyCode?: string; situationId?: string; predictionId?: string; instrumentVersion: string; observedPerformance: number; assessorIndependent: boolean; evidenceReference: string; requestKey: string; notes?: string; observedAt: Date }) {
    const participant = await this.db.pilotParticipant.findFirst({ where: { id: participantId, study: { slug }, status: 'active', consentedAt: { not: null } } })
    if (!participant) throw new AppError('Active consented participant not found', 404)
    const replay = await this.db.pilotMeasurement.findUnique({ where: { participantId_requestKey: { participantId, requestKey: input.requestKey } } })
    if (replay) {
      const same = replay.kind === input.kind && replay.instrumentVersion === input.instrumentVersion && replay.observedPerformance === input.observedPerformance && replay.evidenceReference === input.evidenceReference
      if (!same) throw new AppError('Measurement request key belongs to another observation', 409)
      return replay
    }
    if (['external_speaking', 'ultimate_situation'].includes(input.kind) && !input.assessorIndependent) throw new AppError('This observation requires an independent assessor', 400)
    const requiresPrediction = ['external_speaking', 'ultimate_situation'].includes(input.kind)
    const prediction = input.predictionId ? await this.db.pilotPrediction.findFirst({ where: { id: input.predictionId, participantId }, include: { measurement: true } }) : null
    if (requiresPrediction && !prediction) throw new AppError('A pre-registered ECLA prediction is required', 400)
    if (prediction?.measurement) throw new AppError('This prediction already has an observed outcome', 409)
    if (prediction && (input.situationId !== prediction.situationId || (input.competencyCode ?? null) !== prediction.competencyCode)) throw new AppError('Observation does not match the locked prediction', 409)
    return this.db.pilotMeasurement.create({ data: { participantId, kind: input.kind, week: input.week, competencyCode: input.competencyCode, situationId: input.situationId, predictionId: prediction?.id, instrumentVersion: input.instrumentVersion, predictedMastery: prediction?.predictedMastery, observedPerformance: input.observedPerformance, assessorId: actor, assessorIndependent: input.assessorIndependent, evidenceReference: input.evidenceReference, requestKey: input.requestKey, notes: input.notes, observedAt: input.observedAt } })
  }

  async interview(actor: string, slug: string, participantId: string, input: { week: number; instrumentVersion: string; codedThemes: Record<string, string | number | boolean>; summary: string; requestKey: string; conductedAt: Date }) {
    const participant = await this.db.pilotParticipant.findFirst({ where: { id: participantId, study: { slug }, status: 'active', consentedAt: { not: null } } })
    if (!participant) throw new AppError('Active consented participant not found', 404)
    const replay = await this.db.pilotInterview.findUnique({ where: { participantId_requestKey: { participantId, requestKey: input.requestKey } } })
    if (replay) {
      if (replay.week !== input.week || replay.instrumentVersion !== input.instrumentVersion || replay.summary !== input.summary) throw new AppError('Interview request key belongs to another interview', 409)
      return replay
    }
    return this.db.pilotInterview.create({ data: { participantId, interviewerId: actor, week: input.week, instrumentVersion: input.instrumentVersion, codedThemes: json(input.codedThemes), summary: input.summary, requestKey: input.requestKey, conductedAt: input.conductedAt } })
  }

  async report(slug: string) {
    const study = await this.db.pilotStudy.findUnique({ where: { slug }, include: { participants: { include: { measurements: true, interviews: true } } } })
    if (!study) throw new AppError('Pilot not found', 404)
    return buildPilotReport(study, study.participants, study.participants.flatMap(row => row.measurements), study.participants.reduce((sum, row) => sum + row.interviews.length, 0), this.clock())
  }

  async dashboard(slug: string) {
    const study = await this.db.pilotStudy.findUnique({ where: { slug }, include: { participants: { orderBy: { participantCode: 'asc' }, select: { id: true, participantCode: true, status: true, consentedAt: true, withdrawnAt: true, _count: { select: { predictions: true, measurements: true, interviews: true } } } }, revisions: { orderBy: { createdAt: 'desc' } } } })
    if (!study) throw new AppError('Pilot not found', 404)
    return { study: { id: study.id, slug: study.slug, title: study.title, status: study.status, protocolVersion: study.protocolVersion, consentVersion: study.consentVersion, consentTextHash: study.consentTextHash, targetMin: study.targetMin, targetMax: study.targetMax, durationWeeks: study.durationWeeks, startedAt: study.startedAt, completedAt: study.completedAt }, participants: study.participants, revisions: study.revisions }
  }

  async complete(actor: string, slug: string) {
    const study = await this.db.pilotStudy.findUnique({ where: { slug } })
    if (!study || study.status !== 'running' || !study.startedAt) throw new AppError('Pilot is not running', 409)
    const earliestCompletion = new Date(study.startedAt.getTime() + study.durationWeeks * 7 * 86_400_000)
    if (this.clock() < earliestCompletion) throw new AppError('The preregistered pilot duration has not elapsed', 409)
    const report = await this.report(slug)
    if (report.blockers.length) throw new AppError(`Pilot evidence is incomplete: ${report.blockers.join(' ')}`, 409)
    return this.db.$transaction(async tx => {
      const completedAt = this.clock()
      const completed = await tx.pilotStudy.update({ where: { id: study.id }, data: { status: 'completed', completedAt } })
      await tx.pilotRevision.create({ data: { studyId: study.id, actor, decision: 'data_collection_completed', rationale: 'The preregistered duration elapsed and all automated evidence-completeness gates passed. This does not by itself assert effectiveness.', affectedVersions: json({ protocolVersion: study.protocolVersion }) } })
      return completed
    })
  }

  async recordRevision(actor: string, slug: string, input: { decision: string; rationale: string; affectedVersions: Record<string, string> }) {
    const study = await this.db.pilotStudy.findUnique({ where: { slug } })
    if (!study) throw new AppError('Pilot not found', 404)
    return this.db.pilotRevision.create({ data: { studyId: study.id, actor, decision: input.decision, rationale: input.rationale, affectedVersions: json(input.affectedVersions) } })
  }
}
