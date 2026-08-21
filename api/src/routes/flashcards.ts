/**
 * Flashcards Route — SM-2 spaced repetition over the ECLA vocabulary graph
 * 
 * GET  /api/v1/flashcards/due    → cards due for review (≤20)
 * POST /api/v1/flashcards/review → { vocabId, quality } (0 Again / 3 Hard / 4 Good / 5 Easy)
 * 
 * How cards enter the deck:
 * Vocabulary attached (CompetencyVocabulary) to any competency the learner
 * has been EXPOSED to (has a CompetencyMastery row) gets a UserVocabProgress
 * row lazily on the first due-fetch — no manual "add card" step.
 * 
 * Schedule (§6.5): Day 1 learn → Day 2 → Day 4 → Day 7 → Day 14 → Day 30,
 * implemented as interval steps [1, 2, 4, 7, 14, 30] with SM-2 ease factor.
 * Again (0) resets repetitions; Easy (5) jumps one step ahead.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { AppError } from '../lib/errors'

const router = Router()

// §6.5 spaced-learning intervals (days until next review)
const SCHEDULE = [1, 2, 4, 7, 14, 30]

router.get('/api/v1/flashcards/due', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        // 1) Competencies the learner has been exposed to
        const exposed = await prisma.competencyMastery.findMany({
            where: { userId: user.id },
            select: { competencyId: true },
        })
        const exposedIds = exposed.map(e => e.competencyId)

        // 2) Vocabulary attached to those competencies (deduped)
        const links = exposedIds.length
            ? await prisma.competencyVocabulary.findMany({
                where: { competencyId: { in: exposedIds } },
                include: { vocabulary: true },
            })
            : []
        const vocabById = new Map<string, any>()
        for (const l of links) vocabById.set(l.vocabularyId, l.vocabulary)
        const vocabIds = [...vocabById.keys()]

        // 3) Lazily create progress rows so new words enter review today
        const existing = await prisma.userVocabProgress.findMany({
            where: { userId: user.id, vocabId: { in: vocabIds } },
            select: { vocabId: true },
        })
        const existingIds = new Set(existing.map(e => e.vocabId))
        const missing = vocabIds.filter(id => !existingIds.has(id))
        if (missing.length) {
            await prisma.userVocabProgress.createMany({
                data: missing.map(vocabId => ({
                    userId: user.id,
                    vocabId,
                    nextReviewAt: new Date(), // first retrieval due now
                })),
                skipDuplicates: true,
            })
        }

        // 4) Due cards
        const due = await prisma.userVocabProgress.findMany({
            where: { userId: user.id, nextReviewAt: { lte: new Date() }, vocabId: { in: vocabIds } },
            orderBy: { nextReviewAt: 'asc' },
            take: 20,
        })

        const cards = due
            .filter(p => vocabById.has(p.vocabId))
            .map(p => ({
                id: p.vocabId,
                word: vocabById.get(p.vocabId).word,
                translation: vocabById.get(p.vocabId).translation,
                progress: {
                    interval: p.interval,
                    repetitions: p.repetitions,
                    easeFactor: p.easeFactor,
                },
            }))

        res.json({ cards })
    } catch (error) { next(error) }
})

router.post('/api/v1/flashcards/review', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { vocabId, quality } = req.body ?? {}
        if (typeof vocabId !== 'string' || typeof quality !== 'number') {
            throw new AppError('Invalid review data', 400)
        }

        const progress = await prisma.userVocabProgress.findUnique({
            where: { userId_vocabId: { userId: user.id, vocabId } },
        })
        if (!progress) throw new AppError('Card not found', 404)

        let { easeFactor, interval, repetitions } = progress

        if (quality === 0) {
            // Again: reset to first step (§6.5 Day 1 → Day 2)
            repetitions = 0
            interval = 1
        } else {
            const step = Math.min(repetitions, SCHEDULE.length - 1)
            interval = SCHEDULE[step]
            if (quality === 5) interval = SCHEDULE[Math.min(step + 1, SCHEDULE.length - 1)] // Easy jumps ahead
            if (quality === 3) interval = Math.max(1, Math.round(interval * 0.7))            // Hard shortens
            repetitions += 1

            // Classic SM-2 ease update, clamped at 1.3
            easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        }

        const nextReviewAt = new Date(Date.now() + interval * 24 * 3600 * 1000)

        await prisma.userVocabProgress.update({
            where: { id: progress.id },
            data: { easeFactor, interval, repetitions, nextReviewAt },
        })

        res.json({ success: true, interval, nextReviewAt })
    } catch (error) { next(error) }
})

export default router