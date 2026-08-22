/**
 * Learner Route — ECLA learner model (Phase 2)
 *
 * GET /api/v1/learner/competencies → returns the learner's dimensional profile
 * across all competencies they've interacted with.
 *
 * Response shape:
 * {
 *   competencies: [
 *     {
 *       competencyId, competencyCode, competencyTitle, canDo,
 *       level, overallScore,
 *       dimensions: {
 *         comprehension, retrieval, interaction, application, transfer
 *       },
 *       lastAssessedAt, nextReviewAt
 *     },
 *     ...
 *   ],
 *   summary: {
 *     totalCompetencies,
 *     mastered, developing, notStarted,
 *     weakestDimension, strongestDimension
 *   }
 * }
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

router.get('/api/v1/learner/competencies', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        const masteries = await prisma.competencyMastery.findMany({
            where: { userId: user.id },
            include: {
                competency: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        canDo: true,
                        domain: true,
                    },
                },
            },
            orderBy: { lastAssessedAt: 'desc' },
        })

        const competencies = masteries.map(m => ({
            competencyId: m.competency.id,
            competencyCode: m.competency.code,
            competencyTitle: m.competency.title,
            canDo: m.competency.canDo,
            domain: m.competency.domain,
            level: m.level,
            overallScore: m.overallScore,
            dimensions: {
                comprehension: m.comprehensionScore,
                retrieval: m.retrievalScore,
                interaction: m.interactionScore,
                application: m.applicationScore,
                transfer: m.transferScore,
            },
            lastAssessedAt: m.lastAssessedAt,
            nextReviewAt: m.nextReviewAt,
        }))

        // Compute summary statistics
        const totalCompetencies = competencies.length
        const mastered = competencies.filter(c => c.level === 'TRANSFERRED' || c.level === 'RETAINED').length
        const developing = competencies.filter(c => c.level === 'DEVELOPING' || c.level === 'CONTROLLED').length
        const notStarted = totalCompetencies - mastered - developing

        // Find weakest and strongest dimensions across all competencies
        const dimensionTotals: Record<string, { sum: number; count: number }> = {
            comprehension: { sum: 0, count: 0 },
            retrieval: { sum: 0, count: 0 },
            interaction: { sum: 0, count: 0 },
            application: { sum: 0, count: 0 },
            transfer: { sum: 0, count: 0 },
        }

        for (const c of competencies) {
            for (const [dim, score] of Object.entries(c.dimensions)) {
                if (score !== null) {
                    dimensionTotals[dim].sum += score
                    dimensionTotals[dim].count += 1
                }
            }
        }

        const dimensionAverages = Object.entries(dimensionTotals)
            .filter(([_, v]) => v.count > 0)
            .map(([dim, v]) => ({ dim, avg: Math.round(v.sum / v.count) }))
            .sort((a, b) => a.avg - b.avg)

        const weakestDimension = dimensionAverages[0]?.dim ?? null
        const strongestDimension = dimensionAverages[dimensionAverages.length - 1]?.dim ?? null

        res.json({
            competencies,
            summary: {
                totalCompetencies,
                mastered,
                developing,
                notStarted,
                weakestDimension,
                strongestDimension,
            },
        })
    } catch (error) { next(error) }
})

export default router