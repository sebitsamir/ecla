import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUser } from '../lib/auth'

const router = Router()

router.get('/api/v1/course/map', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUser(req)

        const course = await prisma.course.findFirst({
            where: { isPublished: true },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        concepts: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                mastery: { where: { userId: user.id } },
                                variants: { select: { mode: true } },
                                subLessons: { select: { id: true } },
                                progress: {
                                    where: { userId: user.id },
                                    select: { subLessonId: true, status: true }
                                }
                            },
                        },
                    },
                },
            },
        })

        if (!course) return res.json({ units: [], userXp: { total: user.xpTotal, weekly: 0 } })

        // Calculate weekly XP
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyLogs = await prisma.streakLog.findMany({
            where: {
                userId: user.id,
                date: { gte: weekAgo.toISOString().split('T')[0] }
            }
        })
        const weeklyXp = weeklyLogs.reduce((sum, log) => sum + log.xpEarned, 0)

        const units = course.units.map(unit => ({
            id: unit.id,
            title: unit.title,
            concepts: unit.concepts.map(concept => {
                const mastery = concept.mastery[0]
                const totalAttempts = (mastery?.correctCount || 0) + (mastery?.incorrectCount || 0)
                const accuracy = totalAttempts > 0 ? mastery!.correctCount / totalAttempts : 0

                let status: 'mastered' | 'struggling' | 'in_progress' | 'not_started' = 'not_started'
                if (totalAttempts === 0) status = 'not_started'
                else if (accuracy >= 0.8) status = 'mastered'
                else if (accuracy < 0.6) status = 'struggling'
                else status = 'in_progress'

                const modes = concept.variants.map((v: any) => v.mode)

                // Calculate sub-lesson completion
                const completedSubLessons = concept.progress
                    .filter(p => p.status === 'completed' && p.subLessonId)
                    .map(p => p.subLessonId)
                const totalSubLessons = concept.subLessons.length
                const subLessonProgress = totalSubLessons > 0 
                    ? Math.round((completedSubLessons.length / totalSubLessons) * 100)
                    : 0

                return {
                    id: concept.id,
                    name: concept.name,
                    xpReward: concept.xpReward,
                    grammarNote: concept.grammarNote,
                    modes,
                    isAvailable: modes.includes(user.preferredMode),
                    status,
                    accuracy: Math.round(accuracy * 100),
                    subLessonProgress,
                    completed: concept.progress.length > 0,
                    completedSubLessons: completedSubLessons.length,
                    totalSubLessons,
                }
            }),
        }))

        res.json({
            units,
            preferredMode: user.preferredMode,
            userXp: {
                total: user.xpTotal,
                weekly: weeklyXp,
            }
        })
    } catch (error) { next(error) }
})

export default router