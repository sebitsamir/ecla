import { Router, type Request } from 'express'
import { z } from 'zod'
import { getOrSyncUser } from '../lib/auth'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { GoldenService } from '../golden/service'
import { startSchema, responseSchema, supportSchema, completeSchema } from '../golden/definition'

/** Dependency injection enables HTTP tests without weakening production auth. */
export function createAttemptRouter(service: GoldenService, userId: (req: Request) => Promise<string>) {
    const router = Router()
    const id = (req: Request) => {
        const parsed = z.uuid().safeParse(req.params.id)
        if (!parsed.success) throw new AppError('Invalid attempt ID', 400)
        return parsed.data
    }
    const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
        const parsed = schema.safeParse(body)
        if (!parsed.success) throw new AppError('Invalid attempt request. Send raw actions only.', 400)
        return parsed.data
    }
    router.get('/api/v1/attempts/golden', async (req, res, next) => {
        try { res.json(await service.catalog(await userId(req))) } catch (error) { next(error) }
    })
    router.post('/api/v1/attempts/start', async (req, res, next) => {
        try {
            const user = await userId(req)
            const input = parse(startSchema, req.body)
            res.json(await service.start(user, input.sceneVersionId, input.idempotencyKey))
        } catch (error) { next(error) }
    })
    router.get('/api/v1/attempts/:id', async (req, res, next) => {
        try { res.json(await service.get(await userId(req), id(req))) } catch (error) { next(error) }
    })
    router.post('/api/v1/attempts/:id/responses', async (req, res, next) => {
        try { res.json(await service.respond(await userId(req), id(req), parse(responseSchema, req.body))) } catch (error) { next(error) }
    })
    router.post('/api/v1/attempts/:id/support', async (req, res, next) => {
        try { res.json(await service.support(await userId(req), id(req), parse(supportSchema, req.body).sequence)) } catch (error) { next(error) }
    })
    router.post('/api/v1/attempts/:id/complete', async (req, res, next) => {
        try {
            const user = await userId(req)
            parse(completeSchema, req.body)
            res.json(await service.complete(user, id(req)))
        } catch (error) { next(error) }
    })
    return router
}

export default createAttemptRouter(new GoldenService(prisma), async req => (await getOrSyncUser(req)).id)
