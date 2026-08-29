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
import { computeNextAction, dueReviewsFor } from './adaptive'
import { MasteryLevel } from '@prisma/client'

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
 * GET /api/v1/learner/summary
 * Separates MASTERY (finished) from PROGRESSION (unlocks next steps).
 */
router.get('/api/v1/learner/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const weekAgo = new Date(Date.now() - 7 * 86400000)

        // Separate Mastery from Progression
        const MASTERY_LEVELS: MasteryLevel[] = ['TRANSFERRED', 'RETAINED']
        const PROGRESSION_LEVELS: MasteryLevel[] = ['CONTROLLED', 'TRANSFERRED', 'RETAINED']

        const [total, masteredRows, progressedRows, weekRows, attempts, units] = await Promise.all([
            prisma.competency.count({ where: { level: 'PRE_A1' } }),
            prisma.competencyMastery.findMany({
                where: { userId: user.id, level: { in: MASTERY_LEVELS } },
                select: { competencyId: true },
            }),
            prisma.competencyMastery.findMany({
                where: { userId: user.id, level: { in: PROGRESSION_LEVELS } },
                select: { competencyId: true },
            }),
            prisma.competencyMastery.findMany({
                where: { userId: user.id, level: { in: PROGRESSION_LEVELS }, lastAssessedAt: { gte: weekAgo } },
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

        const mastered = new Set(masteredRows.map(r => r.competencyId))
        const progressed = new Set(progressedRows.map(r => r.competencyId))
        const repairs = attempts.filter(a => (a.evidence as any)?.repairUsed === true).length
        const { dimensions, next } = await computeNextAction(user.id)

        // "Continue learning" cards: demonstrated counts + first open competency.
        const unitCards = units.slice(0, 4).map(u => {
            const done = u.competencies.filter(c => mastered.has(c.id)).length
            const firstOpen = u.competencies.find(c =>
                !progressed.has(c.id) &&
                (c.prerequisitesAsCompetency as { prerequisiteId: string }[]).every(p => progressed.has(p.prerequisiteId)),
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
                demonstrated: mastered.size, // True mastery count
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

/**
 * POST /api/v1/learner/demonstrate
 * Phase 4: STRICT mastery requirements.
 * TRANSFERRED requires multi-context evidence + repair usage.
 * RETAINED requires delayed evidence on top of TRANSFERRED.
 */
router.post('/api/v1/learner/demonstrate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { competencyId, correct = 0, incorrect = 0, evidence, contextId } = req.body ?? {}
        if (!competencyId) return res.status(400).json({ error: 'competencyId required' })

        const total = Number(correct) + Number(incorrect)
        const ratio = total ? Number(correct) / total : 0
        const score = Math.round(ratio * 100)

        const existing = await prisma.competencyMastery.findFirst({
            where: { userId: user.id, competencyId },
        })

        // Normalize evidence
        const ev = (evidence && typeof evidence === 'object') ? evidence as any : {}
        const hasStructuredEvidence = evidence && typeof evidence === 'object'

        // Phase 3: Map frontend evidence to DB dimensions
        const comp = hasStructuredEvidence ? (ev.comprehension ?? null) : score
        const prod = hasStructuredEvidence ? (ev.production ?? ev.application ?? null) : score
        const retr = hasStructuredEvidence ? (ev.retrieval ?? null) : null
        const inter = hasStructuredEvidence ? (ev.interaction ?? null) : null
        const trans = hasStructuredEvidence ? (ev.transfer ?? null) : null
        const repairUsed = hasStructuredEvidence ? (ev.repairUsed === true) : false

        // Best-evidence blending (never demote)
        const best = (prev: number | null | undefined, next: number | null): number | null => {
            if (next === null || next === undefined) return prev ?? null
            return Math.max(prev ?? 0, next)
        }

        const newComp = best(existing?.comprehensionScore, comp)
        const newProd = best(existing?.applicationScore, prod)
        const newRetr = best(existing?.retrievalScore, retr)
        const newInter = best(existing?.interactionScore, inter)
        const newTrans = best(existing?.transferScore, trans)

        // Phase 4: Track context diversity
        // contexts is stored as JSON array in the database (add to schema if needed)
        let contexts: string[] = (existing?.contexts as string[]) ?? []
        if (contextId && !contexts.includes(contextId)) {
            contexts = [...contexts, contextId]
        }

        // Phase 4: Track repair usage
        const repairsCompleted = (existing?.repairsCompleted ?? 0) + (repairUsed ? 1 : 0)

        // Phase 4: Strict Mastery Ladder Promotion
        const now = Date.now()
        const delayed = !!existing?.lastAssessedAt && now - new Date(existing.lastAssessedAt).getTime() >= 24 * 3600 * 1000
        
        let level = existing?.level ?? 'NOT_STARTED'
        
        // RETAINED requires TRANSFERRED + delayed retrieval >= 70
        if (level === 'TRANSFERRED' && delayed && (newRetr ?? 0) >= 70) {
            level = 'RETAINED'
        }
        // TRANSFERRED requires:
        // - Comprehension ≥ 70
        // - Production ≥ 65
        // - Transfer ≥ 60
        // - At least 2 different contexts
        // - At least 1 successful repair
        else if (
            level === 'CONTROLLED' &&
            (newComp ?? 0) >= 70 &&
            (newProd ?? 0) >= 65 &&
            (newTrans ?? 0) >= 60 &&
            contexts.length >= 2 &&
            repairsCompleted >= 1
        ) {
            level = 'TRANSFERRED'
        }
        // CONTROLLED requires basic competence (comprehension >= 60, production >= 50)
        else if (
            (level === 'NOT_STARTED' || level === 'EXPOSED' || level === 'DEVELOPING') &&
            (newComp ?? 0) >= 60 && (newProd ?? 0) >= 50
        ) {
            level = 'CONTROLLED'
        }
        // Otherwise, if engaged, at least DEVELOPING
        else if (level === 'NOT_STARTED' || level === 'EXPOSED') {
            level = 'DEVELOPING'
        }

        const data: any = {
            level,
            lastAssessedAt: new Date(),
            nextReviewAt: new Date(now + (level === 'RETAINED' ? 7 : level === 'TRANSFERRED' ? 3 : 1) * 86400000),
            comprehensionScore: newComp,
            applicationScore: newProd,
            retrievalScore: newRetr,
            interactionScore: newInter,
            transferScore: newTrans,
            contexts,
            repairsCompleted,
        }

        // Calculate overall score from available dimensions
        const dims = [newComp, newProd, newRetr, newInter, newTrans].filter((x): x is number => x !== null && x !== undefined)
        data.overallScore = dims.length ? Math.round(dims.reduce((a, b) => a + b, 0) / dims.length) : 0

        if (existing) {
            await prisma.competencyMastery.update({ where: { id: existing.id }, data })
        } else {
            await prisma.competencyMastery.create({ data: { userId: user.id, competencyId, ...data } })
        }

        res.json({ ok: true, level, contexts: contexts.length, repairs: repairsCompleted })
    } catch (error) { next(error) }
})

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

        const INTERVAL_MS: Record<string, number> = {
            CONTROLLED: 1 * 86400000,
            TRANSFERRED: 3 * 86400000,
            RETAINED: 7 * 86400000,
        }

        const rows = await prisma.competencyMastery.findMany({
            where: {
                userId: user.id,
                level: { in: ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] },
                lastAssessedAt: { not: null },
            },
            select: { competencyId: true, level: true, lastAssessedAt: true },
        })
        const comps = await prisma.competency.findMany({
            where: { id: { in: rows.map(r => r.competencyId) } },
            select: { id: true, code: true, canDo: true },
        })
        const byId = new Map(comps.map(c => [c.id, c]))

        const reviews = rows
            .map(r => {
                const c = byId.get(r.competencyId)
                if (!c || !r.lastAssessedAt) return null
                const dueAt = new Date(r.lastAssessedAt).getTime() + (INTERVAL_MS[r.level] ?? 86400000)
                return {
                    code: c.code,
                    title: c.canDo,
                    level: r.level,
                    dueInHours: Math.round((dueAt - now) / 3600000),
                }
            })
            .filter((r): r is NonNullable<typeof r> => r !== null && r.dueInHours <= 24)
            .sort((a, b) => a.dueInHours - b.dueInHours)
            .slice(0, 3)

        res.json({ ok: true, reviews })
    } catch (error) { next(error) }
})

export default router