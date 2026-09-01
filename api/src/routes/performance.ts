import { rejectUnverifiedAssessment } from '../lib/assessmentFreeze'
/**
 * Performance, errors, confidence, support — Phases 34-37.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { z } from 'zod'


import { environmentFor } from '../lib/worldEnvironments'

const router = Router()

router.post('/api/v1/learner/error', rejectUnverifiedAssessment)

router.post('/api/v1/learner/confidence', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const parsed = z.object({ competencyId: z.string().uuid(), level: z.number().int().min(1).max(4) }).strict().safeParse(req.body)
        if (!parsed.success) return res.status(400).json({ error: 'A valid competencyId and integer level (1-4) are required' })
        const { competencyId, level } = parsed.data
        const competency = await prisma.competency.findUnique({ where: { id: competencyId }, select: { id: true } })
        if (!competency) return res.status(404).json({ error: 'Competency not found' })
        await prisma.learnerEvent.create({
            data: { userId: user.id, competencyId, type: 'confidence', payload: { level, source: 'self_report' } },
        })
        res.json({ ok: true, level })
    } catch (error) { next(error) }
})

router.post('/api/v1/learner/performance', rejectUnverifiedAssessment)

router.get('/api/v1/world/environments', async (_req: Request, res: Response) => {
    const { WORLD_ENVIRONMENTS } = await import('../lib/worldEnvironments')
    res.json({ environments: WORLD_ENVIRONMENTS })
})

router.get('/api/v1/world/environment/:id', async (req: Request, res: Response) => {
    const env = environmentFor(String(req.params.id))
    if (!env) return res.status(404).json({ error: 'Environment not found' })
    res.json({ environment: env })
})

export default router
