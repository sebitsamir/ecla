/**
 * Learner home snapshot — one DB round-trip for mastery, shared across
 * summary + course map + next action (dashboard/course load in one request).
 */
import { prisma } from './prisma'
import { getPublishedCurriculum } from './curriculumCache'
import { shapeCourseMap, finishedSet, progressedSet, type MasteryRow } from './courseMap'
import { bandOf, dueReviewsFor } from '../routes/adaptive'
import { AdaptationService } from '../adaptation/service'

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

    const [curriculum, masteryByCompetency, total, attempts, dueReviews, soonRows, adaptation] = await Promise.all([
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
        new AdaptationService(prisma).plan(user.id),
    ])

    const retentionReviews = await buildRetentionReviews(dueReviews, soonRows)

    const mastered = finishedSet(masteryByCompetency)
    const progressed = progressedSet(masteryByCompetency)
    const dimensions = computeDimensions(masteryByCompetency)
    const planned = adaptation.actions[0]
    const nextAction = {
        ...planned,
        code: planned.competencyCode,
        kind: planned.kind === 'practice' || planned.kind === 'repair' || planned.kind === 'transfer' || planned.kind === 'retention' ? 'lesson' as const : planned.kind,
    }

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
        adaptation,
    }
}

