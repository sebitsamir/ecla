/**
 * Adaptive Engine — ECLA's Next-Best-Action System
 *
 * Constitution Art. 17: "Weaknesses determine progression"
 *
 * This endpoint reads the learner's dimensional mastery profile and
 * recommends the next competency + mode to practice. The logic:
 *
 * 1. Find competencies with weak dimensions or overdue reviews
 * 2. Check prerequisites (don't recommend B if A isn't ready)
 * 3. Select mode based on weakest dimension:
 *    - weak comprehension → STORY
 *    - weak retrieval → DRILL
 *    - weak interaction → IMMERSION
 *    - weak application → PROFESSIONAL
 *    - weak transfer → MISSION
 * 4. Return competency + mode for the frontend to navigate to
 *
 * This is what makes ECLA adaptive rather than linear.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

/**
 * Dimension → Mode mapping (Constitution Art. 17)
 * Each mode trains a specific dimension; weak dimension → train that mode
 */
const DIMENSION_TO_MODE: Record<string, string> = {
    comprehensionScore: 'STORY',
    retrievalScore: 'DRILL',
    interactionScore: 'IMMERSION',
    applicationScore: 'PROFESSIONAL',
    transferScore: 'MISSION',
}

/**
 * Minimum score threshold before a competency is considered "strong enough"
 * Below this = needs more practice in that dimension
 */
const MIN_SCORE_THRESHOLD = 70

/**
 * How many days until a competency is considered "overdue" for review
 */
const OVERDUE_DAYS = 3

router.get('/api/v1/learner/next-activity', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const now = new Date()

        // 1. Get all competencies the learner has interacted with
        const masteries = await prisma.competencyMastery.findMany({
            where: { userId: user.id },
            include: {
                competency: {
                    include: {
                        prerequisites: {
                            include: { prerequisite: true },
                        },
                    },
                },
            },
        })

        // 2. Get all prerequisites the learner has completed
        const completedIds = new Set(
            masteries
                .filter(m => m.level === 'TRANSFERRED' || m.level === 'RETAINED' || m.level === 'CONTROLLED')
                .map(m => m.competencyId)
        )

        // 3. Find competencies that need attention
        const candidates: Array<{
            competencyId: string
            competencyCode: string
            competencyTitle: string
            canDo: string
            weakestDimension: string
            weakestScore: number
            recommendedMode: string
            reason: string
            priority: number
        }> = []

        for (const mastery of masteries) {
            // Check prerequisites: all prereqs must be completed
            const prereqsMet = mastery.competency.prerequisites.every(p =>
                completedIds.has(p.prerequisiteId)
            )
            if (!prereqsMet) continue

            // Find the weakest dimension
            const dimensions = [
                { name: 'comprehensionScore', score: mastery.comprehensionScore },
                { name: 'retrievalScore', score: mastery.retrievalScore },
                { name: 'interactionScore', score: mastery.interactionScore },
                { name: 'applicationScore', score: mastery.applicationScore },
                { name: 'transferScore', score: mastery.transferScore },
            ].filter(d => d.score !== null) as Array<{ name: string; score: number }>

            if (dimensions.length === 0) continue

            const weakest = dimensions.reduce((min, d) => (d.score < min.score ? d : min), dimensions[0])

            // Only recommend if below threshold
            if (weakest.score >= MIN_SCORE_THRESHOLD) continue

            // Check if overdue
            const overdue = mastery.nextReviewAt && new Date(mastery.nextReviewAt) < now
            const daysOverdue = overdue
                ? Math.floor((now.getTime() - new Date(mastery.nextReviewAt!).getTime()) / (1000 * 60 * 60 * 24))
                : 0

            const priority = overdue ? 100 + daysOverdue : 100 - weakest.score

            candidates.push({
                competencyId: mastery.competency.id,
                competencyCode: mastery.competency.code,
                competencyTitle: mastery.competency.title,
                canDo: mastery.competency.canDo,
                weakestDimension: weakest.name.replace('Score', ''),
                weakestScore: weakest.score,
                recommendedMode: DIMENSION_TO_MODE[weakest.name] ?? 'DRILL',
                reason: overdue
                    ? `Overdue for review (${daysOverdue} days)`
                    : `Weak ${weakest.name.replace('Score', '')} (${weakest.score}%)`,
                priority,
            })
        }

        // 4. Sort by priority (highest first) and pick the top recommendation
        candidates.sort((a, b) => b.priority - a.priority)
        const recommendation = candidates[0] ?? null

        // 5. If no candidates, find the next unstarted competency with all prereqs met
        if (!recommendation) {
            const allCompetencies = await prisma.competency.findMany({
                where: { level: 'PRE_A1' },
                include: {
                    prerequisites: {
                        include: { prerequisite: true },
                    },
                },
                orderBy: [{ unit: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
            })

            for (const comp of allCompetencies) {
                if (masteries.some(m => m.competencyId === comp.id)) continue // already started

                const prereqsMet = comp.prerequisites.every(p => completedIds.has(p.prerequisiteId))
                if (!prereqsMet) continue

                // Found the next unstarted competency
                return res.json({
                    success: true,
                    recommendation: {
                        competencyId: comp.id,
                        competencyCode: comp.code,
                        competencyTitle: comp.title,
                        canDo: comp.canDo,
                        weakestDimension: null,
                        weakestScore: null,
                        recommendedMode: 'STORY', // start with comprehension
                        reason: 'Next competency in sequence',
                        priority: 0,
                    },
                })
            }

            // All competencies completed or blocked
            return res.json({
                success: true,
                recommendation: null,
                message: 'All competencies completed or prerequisites not met',
            })
        }

        res.json({
            success: true,
            recommendation,
        })
    } catch (error) {
        next(error)
    }
})

export default router