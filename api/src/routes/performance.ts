/**
 * Performance, errors, confidence, support — Phases 34-37.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { classifyError } from '../lib/errorClassification'
import { computePerformance, mergePerformance } from '../lib/performanceEngine'
import { supportFromCount } from '../lib/supportLevels'
import { environmentFor } from '../lib/worldEnvironments'

const router = Router()

router.post('/api/v1/learner/error', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { competencyId, expected, response, stage, repairAttempted, contextChanged } = req.body ?? {}
        const classified = classifyError({ expected, response, stage, repairAttempted, contextChanged })
        await prisma.learnerEvent.create({
            data: {
                userId: user.id,
                competencyId: competencyId ?? null,
                type: 'error',
                payload: { ...classified, expected, response, stage },
            },
        })
        res.json({ ok: true, ...classified })
    } catch (error) { next(error) }
})

router.post('/api/v1/learner/confidence', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { competencyId, level } = req.body ?? {}
        if (!competencyId || typeof level !== 'number' || level < 1 || level > 4) {
            return res.status(400).json({ error: 'competencyId and level (1-4) required' })
        }
        await prisma.learnerEvent.create({
            data: { userId: user.id, competencyId, type: 'confidence', payload: { level } },
        })
        const existing = await prisma.competencyMastery.findFirst({
            where: { userId: user.id, competencyId },
        })
        if (existing) {
            await prisma.competencyMastery.update({
                where: { id: existing.id },
                data: { confidenceLevel: level },
            })
        }
        res.json({ ok: true, level })
    } catch (error) { next(error) }
})

router.post('/api/v1/learner/performance', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { competencyId, correct, total, responseTimeMs, supportUsed, contexts, repairUsed, delayed } = req.body ?? {}
        if (!competencyId) return res.status(400).json({ error: 'competencyId required' })

        const supportLevel = supportFromCount(Number(supportUsed) || 0)
        const snapshot = computePerformance({
            correct: Number(correct) || 0,
            total: Number(total) || 0,
            responseTimeMs: responseTimeMs ?? null,
            supportLevel,
            contexts: Number(contexts) || 0,
            repairUsed: !!repairUsed,
            delayed: !!delayed,
        })

        const existing = await prisma.competencyMastery.findFirst({
            where: { userId: user.id, competencyId },
        })
        const prev = (existing?.performanceJson as any) ?? null
        const merged = mergePerformance(prev, snapshot)

        if (existing) {
            await prisma.competencyMastery.update({
                where: { id: existing.id },
                data: { performanceJson: merged },
            })
        }

        await prisma.learnerEvent.create({
            data: { userId: user.id, competencyId, type: 'performance', payload: merged },
        })

        res.json({ ok: true, performance: merged })
    } catch (error) { next(error) }
})

router.get('/api/v1/world/environments', async (_req: Request, res: Response) => {
    const { WORLD_ENVIRONMENTS } = await import('../lib/worldEnvironments')
    res.json({ environments: WORLD_ENVIRONMENTS })
})

router.get('/api/v1/world/environment/:id', async (req: Request, res: Response) => {
    const env = environmentFor(req.params.id)
    if (!env) return res.status(404).json({ error: 'Environment not found' })
    res.json({ environment: env })
})

export default router
