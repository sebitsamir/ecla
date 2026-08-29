/**
 * Published curriculum — static until content is re-seeded.
 * Cached in memory to avoid re-fetching 44 competencies on every request.
 */
import { prisma } from './prisma'

export type CurriculumCompetency = {
    id: string
    code: string
    title: string
    canDo: string
    unitId: string
    orderIndex: number
    prerequisiteIds: string[]
    prerequisiteCodes: string[]
    patterns: string[]
}

export type CurriculumUnit = {
    id: string
    title: string
    description: string | null
    orderIndex: number
    competencies: CurriculumCompetency[]
}

export type CurriculumCourse = {
    level: string
    title: string
    units: CurriculumUnit[]
}

type CacheEntry = { at: number; courses: CurriculumCourse[] }

let cache: CacheEntry | null = null
const TTL_MS = 5 * 60_000

const LEVEL_RANK: Record<string, number> = { PRE_A1: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

export async function getPublishedCurriculum(): Promise<CurriculumCourse[]> {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.courses

    const rows = await prisma.course.findMany({
        where: { isPublished: true },
        select: {
            cefrLevel: true,
            title: true,
            units: {
                orderBy: { orderIndex: 'asc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    orderIndex: true,
                    competencies: {
                        orderBy: { orderIndex: 'asc' },
                        select: {
                            id: true,
                            code: true,
                            title: true,
                            canDo: true,
                            orderIndex: true,
                            prerequisitesAsCompetency: {
                                select: {
                                    prerequisiteId: true,
                                    prerequisite: { select: { code: true } },
                                },
                            },
                            realizations: {
                                select: { patterns: true },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
    })

    const courses = rows
        .sort((a, b) => (LEVEL_RANK[a.cefrLevel] ?? 9) - (LEVEL_RANK[b.cefrLevel] ?? 9))
        .map(course => ({
            level: course.cefrLevel,
            title: course.title,
            units: course.units.map(unit => ({
                id: unit.id,
                title: unit.title,
                description: unit.description,
                orderIndex: unit.orderIndex,
                competencies: unit.competencies.map(comp => ({
                    id: comp.id,
                    code: comp.code,
                    title: comp.title,
                    canDo: comp.canDo,
                    unitId: unit.id,
                    orderIndex: comp.orderIndex,
                    prerequisiteIds: comp.prerequisitesAsCompetency.map(p => p.prerequisiteId),
                    prerequisiteCodes: comp.prerequisitesAsCompetency.map(p => p.prerequisite.code),
                    patterns: Array.isArray(comp.realizations[0]?.patterns)
                        ? (comp.realizations[0].patterns as string[])
                        : [],
                })),
            })),
        }))

    cache = { at: Date.now(), courses }
    return courses
}

export function invalidateCurriculumCache() {
    cache = null
}
