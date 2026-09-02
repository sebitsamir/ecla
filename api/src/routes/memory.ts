/**
 * Learner memory — Phase 9 + 31: living world persistence.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { rejectUnverifiedAssessment } from '../lib/assessmentFreeze'

const router = Router()

const CAST_META: Record<string, { personality: string; occupation: string; location: string }> = {
    sofia: { personality: 'warm, patient', occupation: 'barista', location: 'café' },
    marta: { personality: 'friendly, direct', occupation: 'neighbor', location: 'street' },
    daniel: { personality: 'curious, upbeat', occupation: 'student', location: 'classroom' },
    luis: { personality: 'practical, helpful', occupation: 'shopkeeper', location: 'shop' },
    ana: { personality: 'professional, calm', occupation: 'receptionist', location: 'workplace' },
}

router.get('/api/v1/learner/memory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const characters = await prisma.characterMemory.findMany({
            where: { userId: user.id },
            orderBy: { lastMetAt: 'desc' },
        })
        res.json({
            name: user.displayName ?? null,
            characters: characters.map(c => ({
                ...c,
                meta: CAST_META[c.characterId] ?? null,
            })),
        })
    } catch (error) { next(error) }
})

// Retired: clients cannot create encounters or relationship history. Canonical
// attempt completion records these inside the same idempotent transaction.
router.post('/api/v1/learner/memory/encounter', rejectUnverifiedAssessment)

export default router
