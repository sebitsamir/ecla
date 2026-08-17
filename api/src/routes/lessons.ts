import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUser } from '../lib/auth'
import { AppError } from '../lib/errors'
import { cleanVariant } from '../lib/ai'
import { lessonCompleteSchema } from '../lib/schemas'

const VALID_MODES = ['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']

const router = Router()

router.get('/api/v1/lessons/:conceptId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUser(req)
        const conceptId = req.params.conceptId as string

        // Honor the requested mode, fall back to preferred mode
        const requested = req.query.mode as string | undefined
        const mode = requested && VALID_MODES.includes(requested) ? requested : user.preferredMode

        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            include: {
                variants: { where: { mode } },
                subLessons: { orderBy: { orderIndex: 'asc' } },
            },
        }) as any

        if (!concept || concept.variants.length === 0) {
            throw new AppError('Lesson not found or not available in this mode', 404)
        }

        const completedRows = await prisma.userProgress.findMany({
            where: { userId: user.id, conceptId: concept.id, status: 'completed', subLessonId: { not: null } },
            select: { subLessonId: true },
            distinct: ['subLessonId'],
        })
        const completedSubLessonIds = completedRows
            .map(r => r.subLessonId)
            .filter((id): id is string => id !== null)

        res.json({
            lesson: {
                conceptId: concept.id,
                conceptName: concept.name,
                grammarNote: concept.grammarNote,
                mode,
                variant: cleanVariant(concept.variants[0]),
                subLessons: concept.subLessons,
                completedSubLessonIds,
                equippedCosmetic: user.equippedCosmetic ?? 'gold',
            },
        })
    } catch (error) {
        next(error)
    }
})

router.post('/api/v1/lessons/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = lessonCompleteSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid completion data', 400)

        const { conceptId, subLessonId, mode, correctCount, incorrectCount, xpEarned } = parsed.data
        const user = await getOrSyncUser(req)

        await prisma.userProgress.create({
            data: {
                userId: user.id,
                conceptId,
                subLessonId: subLessonId ?? null,
                modeUsed: mode,
                status: 'completed',
                score: correctCount,
                xpEarned,
                completedAt: new Date(),
            },
        })

        await prisma.conceptMastery.upsert({
            where: { userId_conceptId: { userId: user.id, conceptId } },
            update: {
                correctCount: { increment: correctCount },
                incorrectCount: { increment: incorrectCount },
                lastSeenAt: new Date(),
            },
            create: { userId: user.id, conceptId, correctCount, incorrectCount },
        })

        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        const existingTodayLog = await prisma.streakLog.findUnique({
            where: { userId_date: { userId: user.id, date: today } }
        })

        await prisma.streakLog.upsert({
            where: { userId_date: { userId: user.id, date: today } },
            update: { xpEarned: { increment: xpEarned }, lessonsDone: { increment: 1 } },
            create: { userId: user.id, date: today, xpEarned, lessonsDone: 1 },
        })

        let newStreakDays = user.streakDays
        if (!existingTodayLog) {
            const yesterdayLog = await prisma.streakLog.findUnique({
                where: { userId_date: { userId: user.id, date: yesterday } }
            })
            newStreakDays = yesterdayLog ? user.streakDays + 1 : 1
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { xpTotal: { increment: xpEarned }, streakDays: newStreakDays, lastActiveAt: new Date() },
        })

        res.json({ success: true, newXpTotal: updatedUser.xpTotal, newStreak: newStreakDays })
    } catch (error) {
        next(error)
    }
})

export default router