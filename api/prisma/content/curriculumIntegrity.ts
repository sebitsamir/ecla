/**
 * Curriculum integrity — Phase 45: build fails if curriculum is incomplete.
 */
import type { PrismaClient } from '@prisma/client'

export type IntegrityReport = { passed: boolean; errors: string[]; warnings: string[] }

export async function validateCurriculumIntegrity(prisma: PrismaClient): Promise<IntegrityReport> {
    const errors: string[] = []
    const warnings: string[] = []

    const competencies = await prisma.competency.findMany({
        include: {
            realizations: true,
            experiences: true,
            missions: true,
            prerequisitesAsCompetency: true,
            vocabulary: true,
        },
    })

    const codeSet = new Set(competencies.map(c => c.code))

    for (const c of competencies) {
        const tag = c.code
        if (!c.canDo?.trim()) errors.push(`${tag}: missing canDo`)
        if (!c.domain?.trim()) errors.push(`${tag}: missing domain`)
        if (!c.level?.trim()) errors.push(`${tag}: missing level`)
        if (c.realizations.length === 0) errors.push(`${tag}: missing language realization`)
        if (c.experiences.length === 0) errors.push(`${tag}: missing learning experience`)
        if (c.missions.length === 0) warnings.push(`${tag}: no mission defined`)
        if (c.vocabulary.length === 0) warnings.push(`${tag}: no vocabulary linked`)

        for (const p of c.prerequisitesAsCompetency) {
            const prereq = competencies.find(x => x.id === p.prerequisiteId)
            if (!prereq) errors.push(`${tag}: dangling prerequisite ${p.prerequisiteId}`)
        }
    }

    // Cycle detection (DFS)
    const graph = new Map(competencies.map(c => [c.id, c.prerequisitesAsCompetency.map(p => p.prerequisiteId)]))
    const visiting = new Set<string>()
    const visited = new Set<string>()
    function dfs(id: string): boolean {
        if (visiting.has(id)) return true
        if (visited.has(id)) return false
        visiting.add(id)
        for (const p of graph.get(id) ?? []) {
            if (dfs(p)) return true
        }
        visiting.delete(id)
        visited.add(id)
        return false
    }
    for (const c of competencies) {
        if (dfs(c.id)) errors.push(`${c.code}: prerequisite cycle detected`)
    }

    // Unknown prerequisite codes in edges
    for (const c of competencies) {
        for (const p of c.prerequisitesAsCompetency) {
            const prereq = competencies.find(x => x.id === p.prerequisiteId)
            if (prereq && !codeSet.has(prereq.code)) errors.push(`${c.code}: prerequisite code missing from set`)
        }
    }

    return { passed: errors.length === 0, errors, warnings }
}
