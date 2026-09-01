import { Router, type Request } from 'express'
import { z } from 'zod'
import { getOrSyncUser, requireAdmin } from '../lib/auth'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { missionRateLimit } from '../lib/rateLimit'
import { AssessmentService } from '../assessment/service'
import { GroqConversationPartner } from '../assessment/providers'
import { RubricService } from '../assessment/rubrics'

const uuid = z.uuid()
const parse = <T>(schema: z.ZodType<T>, input: unknown): T => { const result = schema.safeParse(input); if (!result.success) throw new AppError('Invalid assessment request', 400); return result.data }
export function createAssessmentRouter(service: AssessmentService, rubrics: RubricService, learner: (req: Request) => Promise<string>, admin: (req: Request) => string) {
    const router = Router()
    const sessionId = (req: Request) => parse(uuid, req.params.id)
    router.post('/api/v1/missions/:competencyId/sessions', missionRateLimit, async (req, res, next) => { try { const owner = await learner(req); const body = parse(z.object({ idempotencyKey: uuid }).strict(), req.body); res.json(await service.startMission(owner, String(req.params.competencyId), body.idempotencyKey)) } catch (error) { next(error) } })
    router.post('/api/v1/gateway/sessions', missionRateLimit, async (req, res, next) => { try { const owner = await learner(req); const body = parse(z.object({ idempotencyKey: uuid }).strict(), req.body); res.json(await service.startGateway(owner, body.idempotencyKey)) } catch (error) { next(error) } })
    router.get('/api/v1/assessment-sessions/:id', async (req, res, next) => { try { res.json(await service.get(await learner(req), sessionId(req))) } catch (error) { next(error) } })
    router.post('/api/v1/assessment-sessions/:id/turns', missionRateLimit, async (req, res, next) => { try { const owner = await learner(req); const body = parse(z.object({ responseKey: uuid, text: z.string().trim().min(1).max(500), source: z.enum(['typed', 'transcript']) }).strict(), req.body); res.json(await service.turn(owner, sessionId(req), body)) } catch (error) { next(error) } })
    router.post('/api/v1/assessment-sessions/:id/evaluate', async (req, res, next) => { try { const owner = await learner(req); parse(z.object({}).strict(), req.body); res.json(await service.evaluateScenario(owner, sessionId(req))) } catch (error) { next(error) } })
    router.post('/api/v1/assessment-sessions/:id/finalize', async (req, res, next) => { try { const owner = await learner(req); parse(z.object({}).strict(), req.body); res.json(await service.finalizeGateway(owner, sessionId(req))) } catch (error) { next(error) } })
    router.post('/api/v1/admin/assessment-rubrics', async (req, res, next) => { try { res.json(await rubrics.draft(admin(req), req.body)) } catch (error) { next(error) } })
    router.get('/api/v1/admin/assessment-rubrics', async (req, res, next) => { try { admin(req); res.json({ rubrics: await rubrics.list(typeof req.query.targetKey === 'string' ? req.query.targetKey : undefined) }) } catch (error) { next(error) } })
    router.post('/api/v1/admin/assessment-rubrics/:id/review', async (req, res, next) => { try { const actor = admin(req); const body = parse(z.object({ note: z.string().trim().min(20).max(2000) }).strict(), req.body); res.json(await rubrics.review(actor, parse(uuid, req.params.id), body.note)) } catch (error) { next(error) } })
    router.get('/api/v1/admin/assessment-sessions/:id', async (req, res, next) => { try { admin(req); const id = sessionId(req); const row = await prisma.assessmentSession.findUnique({ where: { id }, include: { turns: { orderBy: { sequence: 'asc' } }, results: true, acoustics: true, audits: { orderBy: { createdAt: 'asc' } } } }); if (!row) throw new AppError('Assessment session not found', 404); res.json(row) } catch (error) { next(error) } })
    router.post('/api/v1/admin/assessment-sessions/:id/acoustic-observations', async (req, res, next) => { try { const actor = admin(req); const body = parse(z.object({ scenarioId: z.string().min(1).max(100), providerReference: z.string().min(1).max(300), providerVersion: z.string().min(1).max(100), metrics: z.record(z.string(), z.number().finite()).refine(value => Object.keys(value).length <= 30), confidence: z.number().min(0).max(1), consentAttested: z.literal(true), note: z.string().min(20).max(2000) }).strict(), req.body); res.json(await service.recordAcoustic(actor, sessionId(req), body)) } catch (error) { next(error) } })
    router.post('/api/v1/admin/assessment-results/:id/review', async (req, res, next) => { try { const actor = admin(req); const body = parse(z.object({ approved: z.boolean(), expectedDecision: z.boolean().nullable(), confidence: z.number().min(0).max(1), intelligibility: z.number().min(0).max(1).nullable(), acousticObservationId: uuid.nullable(), note: z.string().min(20).max(2000) }).strict(), req.body); res.json(await service.humanReview(actor, parse(uuid, req.params.id), body)) } catch (error) { next(error) } })
    return router
}
const assessmentService = new AssessmentService(prisma, new GroqConversationPartner())
export default createAssessmentRouter(assessmentService, new RubricService(prisma), async req => (await getOrSyncUser(req)).id, requireAdmin)
