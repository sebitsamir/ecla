import { Router, type Request } from 'express'
import { z } from 'zod'
import { getOrSyncUserFast, requireAdmin } from '../lib/auth'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { PilotService } from '../pilot/service'

const service = new PilotService(prisma)
const router = Router()
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success) throw new AppError('Invalid educational pilot request', 400)
  return result.data
}
const slug = (req: Request) => String(req.params.slug)
const participantId = (req: Request) => String(req.params.participantId)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const version = z.string().trim().min(1).max(100)

router.post('/api/v1/admin/pilots', async (req, res, next) => {
  try {
    const actor = requireAdmin(req)
    const body = parse(z.object({ slug: z.string().regex(/^[a-z0-9-]{3,60}$/), title: z.string().trim().min(3).max(200), protocolVersion: version, consentVersion: version, consentTextHash: sha256, targetMin: z.number().int().min(20).max(30), targetMax: z.number().int().min(20).max(30), durationWeeks: z.number().int().min(6).max(8) }).strict().refine(value => value.targetMax >= value.targetMin), req.body)
    res.status(201).json(await service.create(actor, body))
  } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/participants', async (req, res, next) => {
  try {
    const actor = requireAdmin(req)
    const body = parse(z.object({ userId: z.uuid(), eligibilityInstrument: z.string().trim().min(10).max(200) }).strict(), req.body)
    res.status(201).json(await service.invite(actor, slug(req), body))
  } catch (error) { next(error) }
})

router.post('/api/v1/pilots/:slug/consent', async (req, res, next) => {
  try {
    const user = await getOrSyncUserFast(req)
    const body = parse(z.object({ consentVersion: version, confirmation: z.literal('I CONSENT TO THE ECLA PILOT') }).strict(), req.body)
    res.json(await service.consent(user.id, slug(req), body.consentVersion))
  } catch (error) { next(error) }
})

router.post('/api/v1/pilots/:slug/withdraw', async (req, res, next) => {
  try {
    const user = await getOrSyncUserFast(req)
    const body = parse(z.object({ reason: z.string().trim().max(500).optional() }).strict(), req.body)
    res.json(await service.withdraw(user.id, slug(req), body.reason))
  } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/start', async (req, res, next) => {
  try { res.json(await service.start(requireAdmin(req), slug(req))) } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/participants/:participantId/predictions', async (req, res, next) => {
  try {
    const actor = requireAdmin(req)
    const body = parse(z.object({ competencyCode: z.string().trim().min(1).max(80).optional(), situationId: z.string().trim().min(1).max(100), modelVersion: version }).strict(), req.body)
    res.status(201).json(await service.lockPrediction(actor, slug(req), participantId(req), body))
  } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/participants/:participantId/measurements', async (req, res, next) => {
  try {
    const actor = requireAdmin(req)
    const body = parse(z.object({
      kind: z.enum(['baseline', 'weekly', 'post', 'delayed_retention', 'external_speaking', 'ultimate_situation']),
      week: z.number().int().min(0).max(12).optional(), competencyCode: z.string().trim().min(1).max(80).optional(), situationId: z.string().trim().min(1).max(100).optional(),
      instrumentVersion: version, predictionId: z.uuid().optional(), observedPerformance: z.number().min(0).max(1), assessorIndependent: z.boolean(),
      evidenceReference: z.string().trim().min(5).max(300), requestKey: z.uuid(), notes: z.string().trim().max(2000).optional(), observedAt: z.iso.datetime().transform(value => new Date(value)),
    }).strict(), req.body)
    res.status(201).json(await service.measurement(actor, slug(req), participantId(req), body))
  } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/participants/:participantId/interviews', async (req, res, next) => {
  try {
    const actor = requireAdmin(req)
    const body = parse(z.object({ week: z.number().int().min(1).max(8), instrumentVersion: version, codedThemes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).refine(value => Object.keys(value).length <= 30), summary: z.string().trim().min(20).max(4000), requestKey: z.uuid(), conductedAt: z.iso.datetime().transform(value => new Date(value)) }).strict(), req.body)
    res.status(201).json(await service.interview(actor, slug(req), participantId(req), body))
  } catch (error) { next(error) }
})

router.get('/api/v1/admin/pilots/:slug/report', async (req, res, next) => {
  try { requireAdmin(req); res.json(await service.report(slug(req))) } catch (error) { next(error) }
})

router.get('/api/v1/admin/pilots/:slug', async (req, res, next) => {
  try { requireAdmin(req); res.json(await service.dashboard(slug(req))) } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/complete', async (req, res, next) => {
  try { res.json(await service.complete(requireAdmin(req), slug(req))) } catch (error) { next(error) }
})

router.post('/api/v1/admin/pilots/:slug/revisions', async (req, res, next) => {
  try {
    const actor = requireAdmin(req)
    const body = parse(z.object({ decision: z.string().trim().min(3).max(100), rationale: z.string().trim().min(20).max(4000), affectedVersions: z.record(z.string(), z.string().min(1)).refine(value => Object.keys(value).length > 0 && Object.keys(value).length <= 20) }).strict(), req.body)
    res.status(201).json(await service.recordRevision(actor, slug(req), body))
  } catch (error) { next(error) }
})

export default router
