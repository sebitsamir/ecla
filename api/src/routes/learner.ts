/**
 * Learner Route — ECLA learner model (Phase 2 & 3 Alignment).
 * 
 * Constitutional Rules enforced here:
 * 1. CONTROLLED = performs with support. NOT mastery. Does not count as "demonstrated".
 * 2. TRANSFERRED/RETAINED = TRUE mastery.
 * 3. Progression (unlocking next competencies) requires at least CONTROLLED.
 * 4. NO SYNTHETIC EVIDENCE. Transfer score is never derived from correct/total ratio.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { dueReviewsFor } from './adaptive'
import { buildLearnerHome } from '../lib/learnerHome'
import { demonstrateSchema } from '../lib/schemas'
import { AppError } from '../lib/errors'
import { recordDemonstrationEvidence } from '../lib/evidenceService'

const router = Router()

/**
 * GET /api/v1/learner/competencies
 * Returns dimensional profile. Mastery is strictly TRANSFERRED or RETAINED.
 */
router.get('/api/v1/learner/competencies', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const masteries = await prisma.competencyMastery.findMany({
            where: { userId: user.id },
            include: {
                competency: {
                    select: { id: true, code: true, title: true, canDo: true, domain: true },
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

        const totalCompetencies = competencies.length
        // TRUE mastery = TRANSFERRED or RETAINED (Phase 2)
        const mastered = competencies.filter(c => c.level === 'TRANSFERRED' || c.level === 'RETAINED').length
        const developing = competencies.filter(c => c.level === 'DEVELOPING' || c.level === 'CONTROLLED').length
        const notStarted = totalCompetencies - mastered - developing

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

        res.json({
            competencies,
            summary: {
                totalCompetencies,
                mastered,
                developing,
                notStarted,
                weakestDimension: dimensionAverages[0]?.dim ?? null,
                strongestDimension: dimensionAverages[dimensionAverages.length - 1]?.dim ?? null,
            },
        })
    } catch (error) { next(error) }
})

/**
 * GET /api/v1/learner/home
 * Dashboard + course in one round-trip (summary, course map, retention nudges).
 */
router.get('/api/v1/learner/home', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const home = await buildLearnerHome(user)
        res.json(home)
    } catch (error) { next(error) }
})

/**
 * GET /api/v1/learner/summary
 * Separates MASTERY (finished) from PROGRESSION (unlocks next steps).
 */
router.get('/api/v1/learner/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { summary } = await buildLearnerHome(user)
        res.json({ summary })
    } catch (error) { next(error) }
})

/**
 * POST /api/v1/learner/demonstrate
 * POST /api/v1/evidence — canonical evidence endpoint (alias)
 * Strict mastery via masteryEngine — never trusts client scores alone.
 */
async function handleDemonstrate(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await getOrSyncUserFast(req)
        const parsed = demonstrateSchema.safeParse(req.body ?? {})
        if (!parsed.success) throw new AppError('Invalid evidence payload', 400)

        const {
            competencyId,
            correct,
            incorrect,
            evidence,
            contextId,
            sceneId,
            environmentId,
            characterId,
            review,
        } = parsed.data

        const result = await recordDemonstrationEvidence({
            userId: user.id,
            competencyId,
            correct,
            incorrect,
            evidence: evidence as any,
            contextId,
            sceneId,
            environmentId,
            characterId,
            review,
        })

        res.json({ ok: true, ...result })
    } catch (error) { next(error) }
}

router.post('/api/v1/learner/demonstrate', handleDemonstrate)
router.post('/api/v1/evidence', handleDemonstrate)

/**
 * GET /api/v1/learner/recent-accuracy
 * Average accuracy over the last 5 assessed competencies.
 */
router.get('/api/v1/learner/recent-accuracy', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const rows = await prisma.competencyMastery.findMany({
            where: { userId: user.id, comprehensionScore: { not: null } },
            orderBy: { lastAssessedAt: 'desc' },
            take: 5,
            select: { comprehensionScore: true },
        })
        const scores = rows
            .map(r => r.comprehensionScore)
            .filter((x): x is number => typeof x === 'number')
        const avg = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null
        res.json({ ok: true, recentAccuracy: avg, samples: scores.length })
    } catch (error) { next(error) }
})

/**
 * GET /api/v1/learner/upcoming-reviews
 * Spaced-retrieval nudge feed.
 */
router.get('/api/v1/learner/upcoming-reviews', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const now = Date.now()
        const due = await dueReviewsFor(user.id, 5)

        const reviews = due.map(r => ({
            code: r.code,
            title: r.canDo ?? r.title,
            level: 'REVIEW',
            dueInHours: 0,
        }))

        // Also surface items due within 24h (not yet overdue)
        const soon = await prisma.competencyMastery.findMany({
            where: {
                userId: user.id,
                level: { in: ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] },
                nextReviewAt: { gt: new Date(), lte: new Date(now + 24 * 3600 * 1000) },
            },
            include: { competency: { select: { code: true, canDo: true, title: true } } },
            orderBy: { nextReviewAt: 'asc' },
            take: 3,
        })
        for (const r of soon) {
            if (reviews.some(x => x.code === r.competency.code)) continue
            reviews.push({
                code: r.competency.code,
                title: r.competency.canDo ?? r.competency.title,
                level: r.level,
                dueInHours: Math.max(1, Math.round((new Date(r.nextReviewAt!).getTime() - now) / 3600000)),
            })
        }

        res.json({ ok: true, reviews: reviews.slice(0, 3) })
    } catch (error) { next(error) }
})

router.get('/api/v1/learner/chat-context', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { buildLearnerChatContext } = await import('../lib/learnerContext')
        res.json({ context: await buildLearnerChatContext(user.id) })
    } catch (error) { next(error) }
})

export default router