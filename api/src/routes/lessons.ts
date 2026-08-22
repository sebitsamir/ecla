/**
 * Lessons Route — ECLA schema adapter (Phase 2: Multi-dimensional evidence)
 *
 * GET  /api/v1/lessons/:conceptId → competency + its LearningExperiences as "subLessons"
 * POST /api/v1/lessons/complete   → writes dimensional evidence:
 *      UserExperienceProgress + CompetencyMastery (with dimensional scores) + StreakLog + User.xpTotal
 *
 * Phase 2 additions:
 * - Each experience type updates a specific dimension in CompetencyMastery
 * - STORY → comprehensionScore
 * - DRILL → retrievalScore
 * - IMMERSION → interactionScore
 * - PROFESSIONAL → applicationScore
 * - MISSION → transferScore
 * - overallScore = weighted average of all dimensions
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { AppError } from '../lib/errors'
import { lessonCompleteSchema } from '../lib/schemas'

const router = Router()

// ── Normalizers: seed content types → lesson player types ──
const TEACH_TYPE: Record<string, string> = {
    story: 'explain', explanation: 'explain', rule: 'explain', context: 'explain', mission: 'explain',
}

const TYPE_ICON: Record<string, string> = {
    STORY: 'book-open', DRILL: 'puzzle', IMMERSION: 'ear', PROFESSIONAL: 'lightbulb', MISSION: 'message-circle',
}

function normalizeTeach(blocks: any[]): any[] {
    return (blocks ?? [])
        .map((b: any) => {
            if (!b || typeof b !== 'object') return null
            if (b.type === 'pattern') {
                const list = Array.isArray(b.examples) ? b.examples : []
                return { type: 'explain', text: 'Patterns: ' + list.join(' · ') }
            }
            const mapped = { ...b, type: TEACH_TYPE[b.type] ?? b.type }
            if (mapped.type === 'explain' && !mapped.text) return null
            return mapped
        })
        .filter(Boolean) as any[]
}

function normalizeExercise(ex: any): any {
    switch (ex?.type) {
        case 'recognition':
        case 'meaning':
        case 'selection':
            return { type: 'mcq', prompt: ex.prompt, options: ex.options ?? [], answer: ex.answer ?? '' }
        case 'recall':
            return { type: 'fill_blank', prompt: ex.prompt ?? 'Complete the expression.', answer: ex.answer ?? '' }
        default:
            return ex
    }
}

router.get('/api/v1/lessons/:conceptId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        const comp = await prisma.competency.findUnique({
            where: { id: req.params.conceptId },
            include: { experiences: { orderBy: { orderIndex: 'asc' } } },
        })
        if (!comp) throw new AppError('Lesson not found', 404)

        const realization = await prisma.languageRealization.findFirst({
            where: { competencyId: comp.id },
        })

        const progress = await prisma.userExperienceProgress.findMany({
            where: { userId: user.id, experienceId: { in: comp.experiences.map(e => e.id) } },
        })
        const completedIds = progress.filter(p => p.status === 'completed').map(p => p.experienceId)

        const perPartXp = Math.max(5, Math.round(comp.xpReward / Math.max(1, comp.experiences.length)))

        const subLessons = comp.experiences.map((e: any) => {
            const content = (e.content ?? {}) as any
            return {
                id: e.id,
                conceptId: comp.id,
                orderIndex: e.orderIndex,
                title: e.title,
                icon: TYPE_ICON[e.type] ?? 'book-open',
                type: e.type,
                xpReward: perPartXp,
                teach: normalizeTeach(content.teach),
                exercises: (content.exercises ?? []).map(normalizeExercise),
                realLife: content.realLife ?? null,
            }
        })

        const flavorOf = (type: string) => {
            const e = comp.experiences.find(x => x.type === type)
            return ((e?.content as any)?.teach?.[0]?.text) ?? null
        }

        res.json({
            lesson: {
                conceptId: comp.id,
                conceptName: comp.title,
                canDo: comp.canDo,
                mode: (req.query.mode as string) ?? user.preferredMode,
                xpReward: comp.xpReward,
                grammarNote: realization?.grammarNote ?? null,
                variant: {
                    storyBeat: flavorOf('STORY'),
                    culturalRef: flavorOf('IMMERSION'),
                    formalPhrase: flavorOf('PROFESSIONAL'),
                },
                subLessons,
                completedSubLessonIds: completedIds,
                equippedCosmetic: user.equippedCosmetic ?? 'gold',
            },
        })
    } catch (error) { next(error) }
})

/**
 * Complete one part (experience) of a competency.
 * Phase 2: writes dimensional evidence based on experience type.
 */
router.post('/api/v1/lessons/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        const parsed = lessonCompleteSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid completion data', 400)
        const { conceptId, subLessonId, correctCount, incorrectCount, xpEarned } = parsed.data

        // 1) Experience progress
        if (subLessonId) {
            await prisma.userExperienceProgress.upsert({
                where: { userId_experienceId: { userId: user.id, experienceId: subLessonId } },
                update: {
                    status: 'completed',
                    score: correctCount,
                    attempts: { increment: 1 },
                    xpEarned: { increment: xpEarned },
                    completedAt: new Date(),
                    lastAttemptAt: new Date(),
                },
                create: {
                    userId: user.id,
                    experienceId: subLessonId,
                    status: 'completed',
                    score: correctCount,
                    attempts: 1,
                    xpEarned,
                    completedAt: new Date(),
                    lastAttemptAt: new Date(),
                },
            })
        }

        // 2) Get experience type to determine which dimension to update
        const experience = subLessonId
            ? await prisma.learningExperience.findUnique({ where: { id: subLessonId } })
            : null

        // 3) Calculate dimension score for this experience (0-100)
        const totalAttempts = correctCount + incorrectCount
        const dimensionScore = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null

        // 4) Competency mastery — update dimensional scores + level
        const exps = await prisma.learningExperience.findMany({
            where: { competencyId: conceptId }, select: { id: true, type: true },
        })
        const prog = await prisma.userExperienceProgress.findMany({
            where: { userId: user.id, experienceId: { in: exps.map(e => e.id) } },
        })
        const completedSet = new Set(prog.filter(p => p.status === 'completed').map(p => p.experienceId))
        if (subLessonId) completedSet.add(subLessonId)

        const allDone = exps.length > 0 && exps.every(e => completedSet.has(e.id))
        const missionDone = exps.some(e => e.type === 'MISSION' && completedSet.has(e.id))
        const level = allDone ? (missionDone ? 'TRANSFERRED' : 'CONTROLLED') : 'DEVELOPING'

        // Get existing mastery or create new
        const existing = await prisma.competencyMastery.findUnique({
            where: { userId_competencyId: { userId: user.id, competencyId: conceptId } },
        })

        // Build update data with dimensional scores
        const updateData: any = {
            successCount: { increment: correctCount },
            failureCount: { increment: incorrectCount },
            exposureCount: { increment: 1 },
            transferCount: missionDone && allDone ? { increment: 1 } : undefined,
            level,
            lastAssessedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        }

        // Update the dimension corresponding to this experience type
        if (experience && dimensionScore !== null) {
            switch (experience.type) {
                case 'STORY':
                    updateData.comprehensionScore = existing
                        ? { increment: (dimensionScore - (existing.comprehensionScore ?? 0)) }
                        : dimensionScore
                    break
                case 'DRILL':
                    updateData.retrievalScore = existing
                        ? { increment: (dimensionScore - (existing.retrievalScore ?? 0)) }
                        : dimensionScore
                    break
                case 'IMMERSION':
                    updateData.interactionScore = existing
                        ? { increment: (dimensionScore - (existing.interactionScore ?? 0)) }
                        : dimensionScore
                    break
                case 'PROFESSIONAL':
                    updateData.applicationScore = existing
                        ? { increment: (dimensionScore - (existing.applicationScore ?? 0)) }
                        : dimensionScore
                    break
                case 'MISSION':
                    updateData.transferScore = existing
                        ? { increment: (dimensionScore - (existing.transferScore ?? 0)) }
                        : dimensionScore
                    break
            }
        }

        await prisma.competencyMastery.upsert({
            where: { userId_competencyId: { userId: user.id, competencyId: conceptId } },
            update: updateData,
            create: {
                userId: user.id,
                competencyId: conceptId,
                level,
                exposureCount: 1,
                successCount: correctCount,
                failureCount: incorrectCount,
                comprehensionScore: experience?.type === 'STORY' ? dimensionScore : null,
                retrievalScore: experience?.type === 'DRILL' ? dimensionScore : null,
                interactionScore: experience?.type === 'IMMERSION' ? dimensionScore : null,
                applicationScore: experience?.type === 'PROFESSIONAL' ? dimensionScore : null,
                transferScore: experience?.type === 'MISSION' ? dimensionScore : null,
                lastAssessedAt: new Date(),
                nextReviewAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
            },
        })

        // 5) Recompute overallScore as weighted average
        const mastery = await prisma.competencyMastery.findUnique({
            where: { userId_competencyId: { userId: user.id, competencyId: conceptId } },
        })
        if (mastery) {
            const scores = [
                mastery.comprehensionScore,
                mastery.retrievalScore,
                mastery.interactionScore,
                mastery.applicationScore,
                mastery.transferScore,
            ].filter((s): s is number => s !== null)

            if (scores.length > 0) {
                const overallScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
                await prisma.competencyMastery.update({
                    where: { id: mastery.id },
                    data: { overallScore },
                })
            }
        }

        // 6) XP + streak
        const today = new Date().toISOString().split('T')[0]
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { xpTotal: { increment: xpEarned }, lastActiveAt: new Date() },
            }),
            prisma.streakLog.upsert({
                where: { userId_date: { userId: user.id, date: today } },
                update: { xpEarned: { increment: xpEarned }, lessonsDone: { increment: 1 } },
                create: { userId: user.id, date: today, xpEarned, lessonsDone: 1 },
            }),
        ])

        res.json({ success: true, xpEarned })
    } catch (error) { next(error) }
})

export default router