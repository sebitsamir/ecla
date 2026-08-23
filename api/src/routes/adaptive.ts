/**
 * Adaptive Engine — next-best-action + spaced review (Phases 5 & 11).
 *
 * The dashboard never hardcodes "next lesson": it asks this engine,
 * which reads the learner model (dimension scores, mastery levels,
 * prerequisite graph) and answers:
 *   - WHAT to do next (first available, undemonstrated competency)
 *   - HOW to do it (mode biased toward the weakest dimension)
 *   - WHY (a human-readable reason — transparency, Art. 20)
 *
 * Relation names follow the schema: Competency.prerequisitesAsCompetency
 * (rows of CompetencyPrerequisite where this competency is the dependent).
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

const FINISHED = ['CONTROLLED', 'TRANSFERRED', 'RETAINED']
const MODE_BY_DIM: Record<string, string> = {
    comprehension: 'STORY',      // meaning & context
    recall: 'DRILL',             // retrieval & automaticity
    production: 'PROFESSIONAL',  // purposeful output
    interaction: 'IMMERSION',    // spontaneous exchange
    transfer: 'MISSION',         // new-context proof
}

/** Qualitative bands — learners see words, not raw percentages (§11). */
export const bandOf = (v: number | null): string | null =>
    v == null ? null : v >= 75 ? 'Strong' : v >= 50 ? 'Developing' : 'Needs practice'

/** CompetencyIds the learner has demonstrably finished (mastery levels). */
export async function finishedSetFor(userId: string): Promise<Set<string>> {
    const rows = await prisma.competencyMastery.findMany({
        where: { userId, level: { in: FINISHED } },
        select: { competencyId: true },
    })
    return new Set(rows.map(r => r.competencyId))
}

/** Competencies due for spaced retrieval (surfaced as "a familiar face"). */
export async function dueReviewsFor(userId: string, limit = 3) {
    const rows = await prisma.competencyMastery.findMany({
        where: { userId, level: { in: FINISHED }, nextReviewAt: { lte: new Date() } },
        include: { competency: { select: { id: true, code: true, title: true, canDo: true } } },
        orderBy: { nextReviewAt: 'asc' },
        take: limit,
    })
    return rows.map(r => ({ id: r.competency.id, code: r.competency.code, title: r.competency.title, canDo: r.competency.canDo }))
}

/** Dimension averages + next-best-action with a reason. */
export async function computeNextAction(userId: string) {
    const finished = await finishedSetFor(userId)

    const [courses, masteryRows] = await Promise.all([
        prisma.course.findMany({
            where: { isPublished: true },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        competencies: {
                            orderBy: { orderIndex: 'asc' },
                            include: { prerequisitesAsCompetency: { select: { prerequisiteId: true } } },
                        },
                    },
                },
            },
        }),
        prisma.competencyMastery.findMany({ where: { userId } }),
    ])

    // ── Dimension averages across everything assessed ──
    const sums: Record<string, { total: number; n: number }> = {
        comprehension: { total: 0, n: 0 }, recall: { total: 0, n: 0 },
        production: { total: 0, n: 0 }, interaction: { total: 0, n: 0 },
        transfer: { total: 0, n: 0 },
    }
    for (const m of masteryRows) {
        const add = (k: string, v: number | null) => { if (v != null) { sums[k].total += v; sums[k].n++ } }
        add('comprehension', m.comprehensionScore)
        add('recall', m.retrievalScore)
        add('production', m.applicationScore)
        add('interaction', m.interactionScore)
        add('transfer', m.transferScore)
    }
    const dimensions = Object.keys(sums).map(key => {
        const avg = sums[key].n ? Math.round(sums[key].total / sums[key].n) : null
        return { key, avg, band: bandOf(avg) }
    })
    const weakest = [...dimensions]
        .filter((d): d is { key: string; avg: number; band: string } => d.avg != null)
        .sort((a, b) => a.avg - b.avg)[0]

    // ── First available, undemonstrated competency in curriculum order ──
    let target: { comp: any } | null = null
    for (const course of courses) {
        for (const unit of course.units) {
            for (const comp of unit.competencies) {
                if (finished.has(comp.id)) continue
                const open = (comp.prerequisitesAsCompetency as { prerequisiteId: string }[])
                    .every(p => finished.has(p.prerequisiteId))
                if (open) { target = { comp }; break }
            }
            if (target) break
        }
        if (target) break
    }

    if (!target) {
        return {
            dimensions,
            next: {
                kind: 'gateway', title: 'Pre-A1 Gateway',
                canDo: 'Demonstrate everything you can do — on your own.',
                mode: 'MISSION', href: '/gateway',
                reason: 'Every competency is demonstrated. Time to prove it in the wild.',
            },
        }
    }

    const mode = weakest ? MODE_BY_DIM[weakest.key] ?? 'STORY' : 'STORY'
    const reason = weakest
        ? `Because ${weakest.key} is your weakest dimension right now (${weakest.avg}% · ${weakest.band}).`
        : 'Your next step in the journey.'

    return {
        dimensions,
        next: {
            kind: 'lesson',
            competencyId: target.comp.id,
            code: target.comp.code,
            title: target.comp.title,
            canDo: target.comp.canDo,
            mode,
            href: `/learn/${target.comp.id}?mode=${mode}`,
            reason,
        },
    }
}

router.get('/api/v1/adaptive/next', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        res.json(await computeNextAction(user.id))
    } catch (error) { next(error) }
})

router.get('/api/v1/adaptive/review', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        res.json({ due: await dueReviewsFor(user.id) })
    } catch (error) { next(error) }
})

export default router