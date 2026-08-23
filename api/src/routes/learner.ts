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
import { computeNextAction, dueReviewsFor } from './adaptive'

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

/**
 * GET /api/v1/learner/summary — one fetch powers the whole dashboard:
 * proven counts, dimension bands, week evidence, due reviews,
 * adaptive next action, and "continue learning" unit cards.
 */
router.get('/api/v1/learner/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const weekAgo = new Date(Date.now() - 7 * 86400000)

        const [total, finishedRows, weekRows, attempts, units] = await Promise.all([
            prisma.competency.count({ where: { level: 'PRE_A1' } }),
            prisma.competencyMastery.findMany({
                where: { userId: user.id, level: { in: ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] } },
                select: { competencyId: true },
            }),
            prisma.competencyMastery.findMany({
                where: { userId: user.id, level: { in: ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] }, lastAssessedAt: { gte: weekAgo } },
                select: { competencyId: true },
            }),
            prisma.missionAttempt.findMany({
                where: { userId: user.id, completedAt: { gte: weekAgo } },
                select: { evidence: true },
            }),
            prisma.unit.findMany({
                where: { course: { isPublished: true } },
                orderBy: { orderIndex: 'asc' },
                include: {
                    competencies: {
                        orderBy: { orderIndex: 'asc' },
                        select: {
                            id: true, title: true,
                            prerequisitesAsCompetency: { select: { prerequisiteId: true } },
                        },
                    },
                },
            }),
        ])

        const finished = new Set(finishedRows.map(r => r.competencyId))
        const repairs = attempts.filter(a => (a.evidence as any)?.repairUsed === true).length
        const { dimensions, next } = await computeNextAction(user.id)

        // "Continue learning" cards: demonstrated counts + first open competency.
        const unitCards = units.slice(0, 4).map(u => {
            const done = u.competencies.filter(c => finished.has(c.id)).length
            const firstOpen = u.competencies.find(c =>
                !finished.has(c.id) &&
                (c.prerequisitesAsCompetency as { prerequisiteId: string }[]).every(p => finished.has(p.prerequisiteId)),
            )
            return {
                id: u.id, title: u.title,
                demonstrated: done, total: u.competencies.length,
                href: firstOpen ? `/learn/${firstOpen.id}` : null,
            }
        })

        res.json({
            summary: {
                name: (user as any).displayName ?? null,
                demonstrated: finished.size,
                total,
                week: { demonstrated: weekRows.length, conversations: attempts.length, repairs },
                dimensions,
                dueReviews: await dueReviewsFor(user.id),
                nextAction: next,
                units: unitCards,
            },
        })
    } catch (error) { next(error) }
})

export default router