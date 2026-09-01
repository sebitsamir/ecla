import { Router, type Request } from 'express'
import { z } from 'zod'
import { requirePortfolioReviewer } from '../lib/auth'
import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'
import { PortfolioReviewService } from '../portfolio/service'

export function portfolioReviewRouter(service: PortfolioReviewService, admin: (req: Request) => string) {
    const router = Router()
    const parse = <T>(schema: z.ZodType<T>, input: unknown): T => { const result = schema.safeParse(input); if (!result.success) throw new AppError('Invalid portfolio review request', 400); return result.data }
    router.get('/api/v1/admin/pre-a1-portfolio', async (req, res, next) => { try { admin(req); res.json(await service.catalog()) } catch (error) { next(error) } })
    router.post('/api/v1/admin/pre-a1-portfolio/:code/reviews', async (req, res, next) => {
        try {
            const actor = admin(req)
            const body = parse(z.object({ kind: z.enum(['cultural', 'native_speaker']), decision: z.enum(['approved', 'rejected']), expectedContentVersion: z.string().regex(/^[a-f0-9]{64}$/), reviewerQualification: z.string().trim().min(10).max(500), note: z.string().trim().min(20).max(2000), requestKey: z.uuid() }).strict(), req.body)
            res.json(await service.decide(actor, String(req.params.code), body))
        } catch (error) { next(error) }
    })
    return router
}
export default portfolioReviewRouter(new PortfolioReviewService(prisma), requirePortfolioReviewer)
