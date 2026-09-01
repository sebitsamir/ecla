import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUser } from '../lib/auth'
import { AppError } from '../lib/errors'
import { rejectUnverifiedAssessment } from '../lib/assessmentFreeze'
const router = Router()
router.get('/api/v1/missions/:competencyId', async (req, res, next) => {
    try {
        const user = await getOrSyncUser(req)
        const mission = await prisma.mission.findFirst({
            where: { competencyId: String(req.params.competencyId) },
            include: { competency: { select: { code: true, title: true, canDo: true } } },
        })
        if (!mission) throw new AppError('Mission not found', 404)
        const mastery = await prisma.competencyMastery.findUnique({
            where: { userId_competencyId: { userId: user.id, competencyId: mission.competencyId } },
        })
        const eligible = !!mastery
            && ['CONTROLLED', 'TRANSFERRED', 'RETAINED'].includes(mastery.level)
            && (mastery.confidenceLevel ?? 0) >= 70
            && (mastery.performanceJson as { educatorReviewed?: boolean } | null)?.educatorReviewed === true
        res.json({
            mission: { id: mission.id, title: mission.title, scenario: mission.scenario, objective: mission.objective },
            eligible,
            reason: eligible ? null : 'Reviewed CONTROLLED evidence with confidence 70+ is required.',
        })
    } catch (error) {
        next(error)
    }
})
router.post('/api/v1/missions/:competencyId/turn', rejectUnverifiedAssessment)
router.post('/api/v1/missions/:competencyId/evaluate', rejectUnverifiedAssessment)
export default router
