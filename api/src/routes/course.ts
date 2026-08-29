/**
 * Course Map — the journey data (Phase 11.2).
 * Uses cached curriculum + one mastery query (no experience progress joins).
 */
import { Router, Request, Response, NextFunction } from 'express'
import { getOrSyncUserFast } from '../lib/auth'
import { getPublishedCurriculum } from '../lib/curriculumCache'
import { shapeCourseMap, type MasteryRow } from '../lib/courseMap'
import { prisma } from '../lib/prisma'

const router = Router()

async function masteryMapFor(userId: string): Promise<Map<string, MasteryRow>> {
    const rows = await prisma.competencyMastery.findMany({
        where: { userId },
        select: {
            competencyId: true,
            level: true,
            comprehensionScore: true,
            retrievalScore: true,
            interactionScore: true,
            applicationScore: true,
            transferScore: true,
            retentionScore: true,
        },
    })
    return new Map(rows.map(r => [r.competencyId, r]))
}

router.get('/api/v1/course/map', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const [curriculum, mastery] = await Promise.all([
            getPublishedCurriculum(),
            masteryMapFor(user.id),
        ])
        res.json({ courses: shapeCourseMap(curriculum, mastery) })
    } catch (error) { next(error) }
})

export default router
