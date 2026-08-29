/**
 * Lessons Route — ECLA schema adapter (Phase 2 + Phase 3 merged)
 *
 * GET  /api/v1/lessons/:conceptId → competency + experiences as "subLessons"
 * POST /api/v1/lessons/complete   → evidence → mastery (counts + DIMENSIONAL
 *      scores + level) + overallScore + streak + XP
 * POST /api/v1/lessons/grade      → FUNCTIONAL JUDGE (Art. 16):
 *      decides whether MEANING was communicated when the form layer is unsure.
 *      Never teaches, never invents facts (Art. 23). temp 0 + JSON mode.
 *
 * Phase 2 addition in /complete:
 * - Each experience type writes one dimension (0-100), blended with history:
 *   STORY→comprehension · DRILL→retrieval · IMMERSION→interaction ·
 *   PROFESSIONAL→application · MISSION→transfer
 * - overallScore = mean of all non-null dimensions (feeds learner profile)
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast, requireAuth } from '../lib/auth'
import { AppError } from '../lib/errors'
import { lessonCompleteSchema, gradeRequestSchema } from '../lib/schemas'
import { nextReviewDate } from './adaptive'
import { functionalJudge } from '../lib/functionalJudge'

const router = Router()

// ── Normalizers removed (Phase 21): player is scene-engine only ──

const TYPE_ICON: Record<string, string> = {
    STORY: 'book-open', DRILL: 'puzzle', IMMERSION: 'ear', PROFESSIONAL: 'lightbulb', MISSION: 'message-circle',
}

/**
 * Experience type → mastery dimension it produces evidence for (§7.5).
 * Modes as adaptive engine: each delivery mode trains one dimension.
 */
const DIMENSION_BY_TYPE: Record<string, string> = {
    STORY: 'comprehensionScore',
    DRILL: 'retrievalScore',
    IMMERSION: 'interactionScore',
    PROFESSIONAL: 'applicationScore',
    MISSION: 'transferScore',
}

/**
 * Blend a new evidence score into the running dimension score.
 * First evidence = the score itself; afterwards a 60/40 moving average
 * so dimensions move with sustained performance, not single attempts.
 */
function blend(old: number | null | undefined, score: number): number {
    return old == null ? score : Math.round(old * 0.6 + score * 0.4)
}

router.get('/api/v1/lessons/:conceptId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const param = String(req.params.conceptId)

        // Try UUID lookup first, fall back to code lookup
        const includes = {
            experiences: { orderBy: { orderIndex: 'asc' as const } },
            vocabulary: { include: { vocabulary: true } },
        }
        
        let comp = await prisma.competency
            .findFirst({ 
                where: { OR: [{ id: param }, { code: param }] }, 
                include: includes 
            })
            .catch(() => null)
        
        if (!comp) {
            // Fallback: try code-only lookup (in case Postgres rejected non-UUID)
            comp = await prisma.competency.findFirst({ 
                where: { code: param }, 
                include: includes 
            })
        }
        
        if (!comp) throw new AppError('Lesson not found', 404)

        const realization = await prisma.languageRealization.findFirst({ where: { competencyId: comp.id } })
        const mastery = await prisma.competencyMastery.findUnique({
            where: { userId_competencyId: { userId: user.id, competencyId: comp.id } },
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
                content,
                journey: content.subLessons ?? [],
                assessment: e.assessment ?? null,
            }
        })

        const flavorOf = (type: string) => {
            const e = comp!.experiences.find(x => x.type === type)
            const content = (e?.content as any) ?? {}
            return content.modePurpose ?? content.subLessons?.[0]?.objective ?? null
        }

        res.json({
            lesson: {
                code: comp.code,
                conceptId: comp.id,
                conceptName: comp.title,
                canDo: comp.canDo,
                mode: typeof req.query.mode === 'string' ? req.query.mode : user.preferredMode,
                xpReward: comp.xpReward,
                grammarNote: realization?.grammarNote ?? null,
                variant: {
                    storyBeat: flavorOf('STORY'),
                    culturalRef: flavorOf('IMMERSION'),
                    formalPhrase: flavorOf('PROFESSIONAL'),
                },
                tools: {
                    vocabulary: (comp as any).vocabulary.map((l: any) => ({
                        word: l.vocabulary.word,
                        translation: l.vocabulary.translation,
                    })),
                    grammar: realization?.grammarNote ?? null,
                    pronunciation: realization?.pronunciationNote ?? null,
                    culture: realization?.culturalNote ?? null,
                },
                mastery: mastery ? {
                    level: mastery.level,
                    overall: mastery.overallScore ?? null,
                    dimensions: {
                        comprehension: mastery.comprehensionScore,
                        recall: mastery.retrievalScore,
                        production: mastery.applicationScore,
                        interaction: mastery.interactionScore,
                        transfer: mastery.transferScore,
                        retention: null,
                    },
                } : null,
                subLessons,
                completedSubLessonIds: completedIds,
                equippedCosmetic: user.equippedCosmetic ?? 'gold',
            },
        })
    } catch (error) { next(error) }
})

/**
 * POST /api/v1/lessons/grade — FUNCTIONAL JUDGE (Art. 16)
 *
 * Called ONLY when the client form-layer is unsure (open typed answers).
 * Accept when the learner communicates the same core meaning as ANY reference,
 * allowing minor grammar errors, missing words, wrong order, missing accents.
 * Reject when meaning differs, is opposite, or key information is missing.
 */
router.post('/api/v1/lessons/grade', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAuth(req)
        const parsed = gradeRequestSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid grade request', 400)

        const { answer, expected, accept, context } = parsed.data
        const result = await functionalJudge({ answer, expected, accept, context })

        res.json({
            correct: result.accept,
            reason: result.reason,
            evidence: result.evidence,
            source: result.source,
        })
    } catch (error) { next(error) }
})

/**
 * Complete one part (experience) of a competency.
 * Evidence-based: mastery counts + LEVEL per §6.4, DIMENSIONAL scores per §7.5,
 * retention review per §6.5, streak + XP.
 */
router.post('/api/v1/lessons/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        const parsed = lessonCompleteSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid completion data', 400)
        const { conceptId, subLessonId, correctCount, incorrectCount, xpEarned, review } = parsed.data

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
                    userId: user.id, experienceId: subLessonId, status: 'completed',
                    score: correctCount, attempts: 1, xpEarned,
                    completedAt: new Date(), lastAttemptAt: new Date(),
                },
            })
        }

        // 2) Which dimension does this experience produce evidence for?
        const experience = subLessonId
            ? await prisma.learningExperience.findUnique({ where: { id: subLessonId }, select: { type: true } })
            : null
        const totalAttempts = correctCount + incorrectCount
        const dimensionScore = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null
        const dimensionField = experience ? DIMENSION_BY_TYPE[experience.type] ?? null : null

        // 3) Recompute level from completion evidence
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

        // 4) Existing mastery (for blending the dimension score)
        const existing = await prisma.competencyMastery.findUnique({
            where: { userId_competencyId: { userId: user.id, competencyId: conceptId } },
        })

        const updateData: any = {
            successCount: { increment: correctCount },
            failureCount: { increment: incorrectCount },
            exposureCount: { increment: 1 },
            transferCount: missionDone && allDone ? { increment: 1 } : undefined,
            level,
            lastAssessedAt: new Date(),
            nextReviewAt: nextReviewDate(level, review === true),
        }
        // Dimensional evidence: blend new score into the matching dimension
        if (dimensionField && dimensionScore !== null) {
            updateData[dimensionField] = blend((existing as any)?.[dimensionField], dimensionScore)
        }

        const createData: any = {
            userId: user.id, competencyId: conceptId, level,
            exposureCount: 1, successCount: correctCount, failureCount: incorrectCount,
            lastAssessedAt: new Date(),
            nextReviewAt: nextReviewDate(level, review === true),
        }
        if (dimensionField && dimensionScore !== null) {
            createData[dimensionField] = dimensionScore
        }

        await prisma.competencyMastery.upsert({
            where: { userId_competencyId: { userId: user.id, competencyId: conceptId } },
            update: updateData,
            create: createData,
        })

        // 5) overallScore = mean of all non-null dimensions (learner profile)
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
                await prisma.competencyMastery.update({
                    where: { id: mastery.id },
                    data: { overallScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) },
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