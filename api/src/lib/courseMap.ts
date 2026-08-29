/**
 * Course map shaping — user mastery applied to cached curriculum.
 * No per-experience progress joins (220 rows eliminated).
 */
import type { CurriculumCourse } from './curriculumCache'

const FINISHED = new Set(['TRANSFERRED', 'RETAINED'])
const PROGRESSED = new Set(['CONTROLLED', 'TRANSFERRED', 'RETAINED'])
const DEVELOPING_LEVELS = new Set(['EXPOSED', 'DEVELOPING', 'CONTROLLED', 'TRANSFERRED', 'RETAINED'])

export type MasteryRow = {
    competencyId: string
    level: string
    comprehensionScore: number | null
    retrievalScore: number | null
    interactionScore: number | null
    applicationScore: number | null
    transferScore: number | null
    retentionScore: number | null
    lastAssessedAt?: Date | null
}

export function shapeCourseMap(
    courses: CurriculumCourse[],
    masteryByCompetency: Map<string, MasteryRow>,
) {
    const finished = new Set<string>()
    const developing = new Set<string>()

    for (const course of courses) {
        for (const unit of course.units) {
            for (const comp of unit.competencies) {
                const m = masteryByCompetency.get(comp.id)
                if (m && FINISHED.has(m.level)) finished.add(comp.id)
                else if (m && DEVELOPING_LEVELS.has(m.level)) developing.add(comp.id)
            }
        }
    }

    return courses.map(course => ({
        level: course.level,
        title: course.title,
        units: course.units.map(unit => {
            const comps = unit.competencies.map(comp => {
                const prereqsMet = comp.prerequisiteIds.every(id => finished.has(id))
                const m = masteryByCompetency.get(comp.id)
                const status = finished.has(comp.id) ? 'mastered'
                    : developing.has(comp.id) ? 'developing'
                        : prereqsMet ? 'upcoming' : 'locked'
                return {
                    id: comp.id,
                    code: comp.code,
                    title: comp.title,
                    canDo: comp.canDo,
                    status,
                    href: `/learn/${comp.id}`,
                    prerequisites: comp.prerequisiteCodes,
                    patterns: comp.patterns,
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
                    mastered: comps.filter(c => c.status === 'mastered').length,
                    developing: comps.filter(c => c.status === 'developing').length,
                    upcoming: comps.filter(c => c.status === 'upcoming').length,
                    locked: comps.filter(c => c.status === 'locked').length,
                    total: comps.length,
                },
            }
        }),
    }))
}

export function finishedSet(masteryByCompetency: Map<string, MasteryRow>): Set<string> {
    const out = new Set<string>()
    for (const [id, m] of masteryByCompetency) {
        if (FINISHED.has(m.level)) out.add(id)
    }
    return out
}

export function progressedSet(masteryByCompetency: Map<string, MasteryRow>): Set<string> {
    const out = new Set<string>()
    for (const [id, m] of masteryByCompetency) {
        if (PROGRESSED.has(m.level)) out.add(id)
    }
    return out
}
