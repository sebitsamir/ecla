/**
 * Course Map — the journey data (Phase 11.2).
 *
 * Returns published courses → units → competencies with HONEST statuses:
 *   mastered   → mastery level TRANSFERRED/RETAINED (true demonstration)
 *   developing → some evidence, not yet demonstrated
 *   upcoming   → prerequisites met, not started
 *   locked     → prerequisites not met (the graph, made visible)
 * Statuses are resolved across ALL courses so cross-level prerequisites work.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

// Phase 2: only TRANSFERRED/RETAINED count as demonstrated mastery
const FINISHED = ['TRANSFERRED', 'RETAINED']
const PROGRESSED = ['CONTROLLED', 'TRANSFERRED', 'RETAINED']
const LEVEL_RANK: Record<string, number> = { PRE_A1: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

router.get('/api/v1/course/map', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        const courses = await prisma.course.findMany({
            where: { isPublished: true },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        competencies: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                mastery: { where: { userId: user.id } },
                                experiences: {
                                    select: { id: true, progress: { where: { userId: user.id }, select: { status: true } } },
                                },
                                realizations: {
                                    select: { patterns: true },
                                    take: 1,
                                },
                                prerequisitesAsCompetency: {
                                    select: {
                                        prerequisiteId: true,
                                        prerequisite: { select: { code: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
        courses.sort((a, b) => (LEVEL_RANK[a.cefrLevel] ?? 9) - (LEVEL_RANK[b.cefrLevel] ?? 9))

        // Pass 1: global finished/developing sets (cross-course prerequisite resolution).
        const finished = new Set<string>()
        const developing = new Set<string>()
        for (const course of courses) {
            for (const unit of course.units) {
                for (const comp of unit.competencies) {
                    const m = (comp as any).mastery?.[0]
                    const done = ((comp as any).experiences ?? []).filter((e: any) => e.progress?.[0]?.status === 'completed').length
                    if (m && (FINISHED as string[]).includes(m.level)) finished.add(comp.id)
                    else if ((m && (PROGRESSED as string[]).includes(m.level)) || (m && ['EXPOSED', 'DEVELOPING'].includes(m.level)) || done > 0) developing.add(comp.id)
                }
            }
        }

        // Pass 2: shape the response.
        const shaped = courses.map(course => ({
            level: course.cefrLevel,
            title: course.title,
            units: course.units.map(unit => {
                const comps = (unit as any).competencies.map((comp: any) => {
                    const prereqsMet = (comp.prerequisitesAsCompetency as { prerequisiteId: string }[])
                        .every(p => finished.has(p.prerequisiteId))
                    const m = comp.mastery?.[0]
                    const status = finished.has(comp.id) ? 'mastered'
                        : developing.has(comp.id) ? 'developing'
                            : prereqsMet ? 'upcoming' : 'locked'
                    const patterns = Array.isArray(comp.realizations?.[0]?.patterns)
                        ? (comp.realizations[0].patterns as string[])
                        : []
                    return {
                        id: comp.id, code: comp.code, title: comp.title, canDo: comp.canDo,
                        status, href: `/learn/${comp.id}`,
                        prerequisites: (comp.prerequisitesAsCompetency as { prerequisite: { code: string } }[])
                            .map(p => p.prerequisite.code),
                        patterns,
                        evidence: m ? {
                            comprehension: m.comprehensionScore,
                            retrieval: m.retrievalScore,
                            interaction: m.interactionScore,
                            application: m.applicationScore,
                            transfer: m.transferScore,
                            retention: m.retentionScore,
                        } : null,
                    }
                })
                return {
                    id: unit.id,
                    title: unit.title,
                    description: unit.description,
                    competencies: comps,
                    counts: {
                        mastered: comps.filter((c: any) => c.status === 'mastered').length,
                        developing: comps.filter((c: any) => c.status === 'developing').length,
                        upcoming: comps.filter((c: any) => c.status === 'upcoming').length,
                        locked: comps.filter((c: any) => c.status === 'locked').length,
                        total: comps.length,
                    },
                }
            }),
        }))

        res.json({ courses: shaped })
    } catch (error) { next(error) }
})

export default router