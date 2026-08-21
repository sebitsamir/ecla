/**
 * Course Map Route — ECLA schema adapter
 * 
 * Reads: Course → Unit → Competency (+ mastery, experiences, prerequisites)
 * Emits: the SAME shape the course page already consumes:
 *   { units: [{ id, title, concepts: [{ id, name, status, isAvailable,
 *     completedSubLessons, totalSubLessons, subLessonProgress, accuracy, modes }] }],
 *     preferredMode }
 * 
 * Mapping (spec §12):
 * - Concept          → Competency
 * - SubLessons       → LearningExperiences (completion = UserExperienceProgress)
 * - Mastery 80% rule → CompetencyMastery.level (CONTROLLED/TRANSFERRED/RETAINED = finished)
 * - Linear unlock    → CompetencyPrerequisite graph (available when all prereqs finished)
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

// §6.4 — levels that count as "finished" for unlocking dependents
const FINISHED_LEVELS = ['CONTROLLED', 'TRANSFERRED', 'RETAINED']

router.get('/api/v1/course/map', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        const course = await prisma.course.findFirst({
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
                                    orderBy: { orderIndex: 'asc' },
                                    select: {
                                        id: true,
                                        type: true,
                                        progress: { where: { userId: user.id }, select: { status: true } },
                                    },
                                },
                                prerequisitesAsCompetency: {
                                    select: {
                                        prerequisite: {
                                            select: {
                                                id: true,
                                                mastery: { where: { userId: user.id }, select: { level: true } },
                                                experiences: {
                                                    select: { id: true, progress: { where: { userId: user.id }, select: { status: true } } },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!course) return res.json({ units: [], preferredMode: user.preferredMode })

        // A competency is FINISHED when mastery says so, or all its experiences are completed
        const finishedOf = (c: any): boolean => {
            const m = c.mastery?.[0]
            if (m && FINISHED_LEVELS.includes(m.level)) return true
            const exps = c.experiences ?? []
            if (exps.length === 0) return false
            return exps.every((e: any) => e.progress?.[0]?.status === 'completed')
        }

        // Pass 1: finished map (needed for prerequisite availability checks)
        const finishedMap = new Map<string, boolean>()
        for (const u of course.units) for (const c of u.competencies) finishedMap.set(c.id, finishedOf(c))

        // Pass 2: build the UI contract
        const units = course.units.map((u: any) => ({
            id: u.id,
            title: u.title,
            description: u.description,
            concepts: u.competencies.map((c: any) => {
                const exps = c.experiences ?? []
                const total = exps.length
                const done = exps.filter((e: any) => e.progress?.[0]?.status === 'completed').length

                const m = c.mastery?.[0]
                const attempts = (m?.successCount ?? 0) + (m?.failureCount ?? 0)
                const accuracy = attempts > 0 ? Math.round(((m?.successCount ?? 0) / attempts) * 100) : 0
                const finished = finishedMap.get(c.id)

                // §5.8 — no artificial prerequisites: available iff every prereq is finished
                const isAvailable = (c.prerequisitesAsCompetency ?? []).every((p: any) => finishedMap.get(p.prerequisite.id))

                const status = finished
                    ? (m && (m.level === 'RETAINED' || m.level === 'TRANSFERRED') ? 'mastered'
                        : (attempts >= 2 && accuracy > 0 && accuracy < 60 ? 'struggling' : 'completed'))
                    : (done > 0 ? 'in_progress' : 'available')

                return {
                    id: c.id,
                    name: c.title,
                    status,
                    isAvailable,
                    completedSubLessons: done,
                    totalSubLessons: total,
                    subLessonProgress: total ? Math.round((done / total) * 100) : 0,
                    accuracy,
                    modes: ['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL'],
                    xpReward: c.xpReward,
                }
            }),
        }))

        res.json({ units, preferredMode: user.preferredMode })
    } catch (error) { next(error) }
})

export default router