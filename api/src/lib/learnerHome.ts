/**
 * Learner home snapshot — one DB round-trip for mastery, shared across
 * summary + course map + next action (dashboard/course load in one request).
 */
import { prisma } from './prisma'
import { getPublishedCurriculum } from './curriculumCache'
import { shapeCourseMap, finishedSet, progressedSet, type MasteryRow } from './courseMap'
import { bandOf, dueReviewsFor } from '../routes/adaptive'

const MODE_BY_DIM: Record<string, string> = {
    comprehension: 'STORY',
    recall: 'DRILL',
    production: 'PROFESSIONAL',
    interaction: 'IMMERSION',
    transfer: 'MISSION',
}

async function loadMasteryMap(userId: string): Promise<Map<string, MasteryRow>> {
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
            lastAssessedAt: true,
        },
    })
    return new Map(rows.map(r => [r.competencyId, r]))
}

function computeDimensions(masteryByCompetency: Map<string, MasteryRow>) {
    const sums: Record<string, { total: number; n: number }> = {
        comprehension: { total: 0, n: 0 }, recall: { total: 0, n: 0 },
        production: { total: 0, n: 0 }, interaction: { total: 0, n: 0 },
        transfer: { total: 0, n: 0 },
    }
    for (const m of masteryByCompetency.values()) {
        const add = (k: string, v: number | null) => { if (v != null) { sums[k].total += v; sums[k].n++ } }
        add('comprehension', m.comprehensionScore)
        add('recall', m.retrievalScore)
        add('production', m.applicationScore)
        add('interaction', m.interactionScore)
        add('transfer', m.transferScore)
    }
    return Object.keys(sums).map(key => {
        const avg = sums[key].n ? Math.round(sums[key].total / sums[key].n) : null
        return { key, avg, band: bandOf(avg) }
    })
}

function computeNextActionFromSnapshot(
    curriculum: Awaited<ReturnType<typeof getPublishedCurriculum>>,
    masteryByCompetency: Map<string, MasteryRow>,
    dimensions: ReturnType<typeof computeDimensions>,
    due: Awaited<ReturnType<typeof dueReviewsFor>>,
) {
    if (due.length > 0) {
        const rv = due[0]
        return {
            kind: 'review' as const,
            competencyId: rv.id,
            code: rv.code,
            title: rv.title,
            canDo: rv.canDo,
            mode: 'STORY',
            href: `/learn/${rv.id}?review=1`,
            reason: 'Someone wants to see you again — a quick hello keeps it alive.',
        }
    }

    const finished = finishedSet(masteryByCompetency)
    const progressed = progressedSet(masteryByCompetency)
    const weakest = [...dimensions]
        .filter((d): d is { key: string; avg: number; band: string } => d.avg != null)
        .sort((a, b) => a.avg - b.avg)[0]

    for (const course of curriculum) {
        for (const unit of course.units) {
            for (const comp of unit.competencies) {
                if (finished.has(comp.id)) continue
                const open = comp.prerequisiteIds.every(id => progressed.has(id))
                if (open) {
                    const mode = weakest ? MODE_BY_DIM[weakest.key] ?? 'STORY' : 'STORY'
                    const reason = weakest
                        ? `Because ${weakest.key} is your weakest dimension right now (${weakest.avg}% · ${weakest.band}).`
                        : 'Your next step in the journey.'
                    return {
                        kind: 'lesson' as const,
                        competencyId: comp.id,
                        code: comp.code,
                        title: comp.title,
                        canDo: comp.canDo,
                        mode,
                        href: `/learn/${comp.id}?mode=${mode}`,
                        reason,
                    }
                }
            }
        }
    }

    return {
        kind: 'gateway' as const,
        title: 'Pre-A1 Gateway',
        canDo: 'Demonstrate everything you can do — on your own.',
        mode: 'MISSION',
        href: '/gateway',
        reason: 'Every competency is demonstrated. Time to prove it in the wild.',
    }
}

async function buildRetentionReviews(
    due: Awaited<ReturnType<typeof dueReviewsFor>>,
    soon: Array<{
        level: string
        nextReviewAt: Date | null
        competency: { code: string; canDo: string; title: string }
    }>,
) {
    const now = Date.now()
    const reviews = due.map(r => ({
        code: r.code,
        title: r.canDo ?? r.title,
        level: 'REVIEW',
        dueInHours: 0,
    }))

    for (const r of soon) {
        if (reviews.some(x => x.code === r.competency.code)) continue
        reviews.push({
            code: r.competency.code,
            title: r.competency.canDo ?? r.competency.title,
            level: r.level,
            dueInHours: Math.max(1, Math.round((new Date(r.nextReviewAt!).getTime() - now) / 3600000)),
        })
    }

    return reviews.slice(0, 3)
}

export async function buildLearnerHome(user: { id: string; displayName?: string | null }) {
    const weekAgo = new Date(Date.now() - 7 * 86400000)

    const [curriculum, masteryByCompetency, total, attempts, dueReviews, soonRows] = await Promise.all([
        getPublishedCurriculum(),
        loadMasteryMap(user.id),
        prisma.competency.count({ where: { level: 'PRE_A1' } }),
        prisma.missionAttempt.findMany({
            where: { userId: user.id, completedAt: { gte: weekAgo } },
            select: { evidence: true },
        }),
        dueReviewsFor(user.id),
        prisma.competencyMastery.findMany({
            where: {
                userId: user.id,
                level: { in: ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] },
                nextReviewAt: { gt: new Date(), lte: new Date(Date.now() + 24 * 3600 * 1000) },
            },
            select: {
                level: true,
                nextReviewAt: true,
                competency: { select: { code: true, canDo: true, title: true } },
            },
            orderBy: { nextReviewAt: 'asc' },
            take: 3,
        }),
    ])

    const retentionReviews = await buildRetentionReviews(dueReviews, soonRows)

    const mastered = finishedSet(masteryByCompetency)
    const progressed = progressedSet(masteryByCompetency)
    const dimensions = computeDimensions(masteryByCompetency)
    const nextAction = computeNextActionFromSnapshot(curriculum, masteryByCompetency, dimensions, dueReviews)

    let weekDemonstrated = 0
    for (const m of masteryByCompetency.values()) {
        if (progressed.has(m.competencyId) && m.lastAssessedAt && m.lastAssessedAt >= weekAgo) weekDemonstrated++
    }

    const unitCards = curriculum[0]?.units.slice(0, 4).map(unit => {
        const done = unit.competencies.filter(c => mastered.has(c.id)).length
        const firstOpen = unit.competencies.find(c =>
            !progressed.has(c.id) &&
            c.prerequisiteIds.every(id => progressed.has(id)),
        )
        return {
            id: unit.id,
            title: unit.title,
            demonstrated: done,
            total: unit.competencies.length,
            href: firstOpen ? `/learn/${firstOpen.id}` : null,
        }
    }) ?? []

    const courses = shapeCourseMap(curriculum, masteryByCompetency)
    const repairs = attempts.filter(a => (a.evidence as { repairUsed?: boolean })?.repairUsed === true).length

    return {
        summary: {
            name: user.displayName ?? null,
            demonstrated: mastered.size,
            total,
            week: { demonstrated: weekDemonstrated, conversations: attempts.length, repairs },
            dimensions,
            dueReviews,
            nextAction,
            units: unitCards,
        },
        courses,
        retentionReviews,
    }
}

