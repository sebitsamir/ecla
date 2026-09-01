import { rejectUnverifiedAssessment } from '../lib/assessmentFreeze'
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
import { gradeRequestSchema } from '../lib/schemas'
import { functionalJudge } from '../lib/functionalJudge'



const router = Router()

// ── Normalizers removed (Phase 21): player is scene-engine only ──

const TYPE_ICON: Record<string, string> = {
    STORY: 'book-open', DRILL: 'puzzle', IMMERSION: 'ear', PROFESSIONAL: 'lightbulb', MISSION: 'message-circle',
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
                        retention: mastery.retentionScore,
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

/** Retired: legacy completions cannot safely award progress or XP. */
router.post('/api/v1/lessons/complete', rejectUnverifiedAssessment)

export default router
