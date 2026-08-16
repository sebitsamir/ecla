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
                            },
                        },
                    },
                },
            },
        })

        if (!course) return res.json({ units: [] })

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

                return {
                    id: concept.id, name: concept.name, xpReward: concept.xpReward,
                    grammarNote: concept.grammarNote, modes,
                    isAvailable: modes.includes(user.preferredMode),
                    status, accuracy: Math.round(accuracy * 100),
                }
            }),
        }))

        res.json({ units, preferredMode: user.preferredMode })
    } catch (error) { next(error) }
})

export default router