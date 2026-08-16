import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUser } from '../lib/auth'
import { AppError } from '../lib/errors'
import { flashcardReviewSchema } from '../lib/schemas'

const router = Router()

router.get('/api/v1/flashcards/due', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUser(req)
        const now = new Date()

        const allVocab = await prisma.vocabulary.findMany({ where: { courseId: 'course-spanish-a1' } })
        const progress = await prisma.userVocabProgress.findMany({
            where: { userId: user.id, vocabId: { in: allVocab.map(v => v.id) } }
        })

        const dueCards = allVocab.map(vocab => {
            const prog = progress.find(p => p.vocabId === vocab.id)
            if (!prog || prog.nextReviewAt <= now) {
                return { id: vocab.id, word: vocab.word, translation: vocab.translation, progress: prog || null }
            }
            return null
        }).filter(Boolean)

        res.json({ cards: dueCards.slice(0, 20) })
    } catch (error) { next(error) }
})

router.post('/api/v1/flashcards/review', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = flashcardReviewSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid review data', 400)

        const { vocabId, quality } = parsed.data
        const user = await getOrSyncUser(req)

        let prog = await prisma.userVocabProgress.findFirst({ where: { userId: user.id, vocabId } })

        let easeFactor = prog?.easeFactor ?? 2.5
        let interval = prog?.interval ?? 1
        let repetitions = prog?.repetitions ?? 0

        if (quality < 3) {
            repetitions = 0
            interval = 1
        } else {
            if (repetitions === 0) interval = 1
            else if (repetitions === 1) interval = 6
            else interval = Math.round(interval * easeFactor)
            repetitions += 1
        }

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        if (easeFactor < 1.3) easeFactor = 1.3

        const nextReviewAt = new Date()
        nextReviewAt.setDate(nextReviewAt.getDate() + interval)

        if (prog) {
            await prisma.userVocabProgress.update({
                where: { id: prog.id },
                data: { easeFactor, interval, repetitions, nextReviewAt },
            })
        } else {
            await prisma.userVocabProgress.create({
                data: { userId: user.id, vocabId, easeFactor, interval, repetitions, nextReviewAt },
            })
        }

        res.json({ success: true, nextReviewInDays: interval })
    } catch (error) { next(error) }
})

export default router