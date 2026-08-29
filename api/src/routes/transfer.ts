/**
 * Transfer missions — Phase 33: known → varied → unfamiliar context.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

router.get('/api/v1/transfer/next', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const mastered = await prisma.competencyMastery.findMany({
            where: { userId: user.id, level: { in: ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] } },
            include: {
                competency: {
                    include: { missions: { take: 1 } },
                },
            },
            orderBy: { lastAssessedAt: 'asc' },
            take: 5,
        })

        const candidates = mastered
            .filter(m => m.competency.missions.length > 0)
            .map(m => {
                const contexts = (m.contexts as string[]) ?? []
                const stage = contexts.length >= 2 ? 'unfamiliar' : contexts.length === 1 ? 'varied' : 'known'
                return {
                    competencyId: m.competencyId,
                    code: m.competency.code,
                    canDo: m.competency.canDo,
                    missionId: m.competency.missions[0].id,
                    missionTitle: m.competency.missions[0].title,
                    transferStage: stage,
                    href: `/learn/${m.competency.code}?mode=MISSION&transfer=1`,
                }
            })

        res.json({ transfers: candidates })
    } catch (error) { next(error) }
})

export default router
