/**
 * Content validation API — Phase 18.
 * Exposes the seed-time validation gate for admin authoring.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { requireAdmin } from '../lib/auth'
import { phases, runContentValidation } from '../lib/contentValidation'
import { prisma } from '../lib/prisma'

const router = Router()

router.post('/api/v1/content/validate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const comps = await prisma.competency.findMany({ select: { code: true } })
        const knownCodes = new Set(comps.map(c => String(c.code).trim()))
        const report = runContentValidation(phases, knownCodes)
        res.json(report)
    } catch (error) { next(error) }
})

export default router
