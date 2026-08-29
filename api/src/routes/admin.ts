/**
 * Admin routes — Phase 19: competency-aligned authoring.
 * Replaces legacy Concept/SubLesson with current Prisma models.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { groq } from '../lib/groq'
import { requireAdmin } from '../lib/auth'
import { AppError } from '../lib/errors'
import { sanitizeAIOutput, CONTENT_SYSTEM_PROMPT } from '../lib/ai'
import { generateSchema, exerciseGenSchema } from '../lib/schemas'
import { phases, runContentValidation } from '../lib/contentValidation'

const router = Router()

/** Course tree for authoring navigation. */
router.get('/api/v1/admin/course-tree', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const courses = await prisma.course.findMany({
            where: { isPublished: true },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        competencies: {
                            orderBy: { orderIndex: 'asc' },
                            select: { id: true, code: true, title: true, canDo: true, domain: true },
                        },
                    },
                },
            },
        })
        res.json({ courses })
    } catch (error) { next(error) }
})

/** Full competency detail for editing. */
router.get('/api/v1/admin/competencies/:code', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const code = String(req.params.code).trim()
        const comp = await prisma.competency.findFirst({
            where: { code },
            include: {
                experiences: { orderBy: { orderIndex: 'asc' } },
                realizations: true,
                vocabulary: { include: { vocabulary: true } },
                missions: true,
                prerequisitesAsCompetency: { include: { prerequisite: { select: { code: true } } } },
            },
        })
        if (!comp) throw new AppError('Competency not found', 404)
        res.json({ competency: comp })
    } catch (error) { next(error) }
})

/** Update competency metadata + realization (content depth stays in seed phases). */
router.patch('/api/v1/admin/competencies/:code', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const code = String(req.params.code).trim()
        const { title, canDo, grammarNote, pronunciationNote, culturalNote } = req.body ?? {}

        const comp = await prisma.competency.findFirst({ where: { code } })
        if (!comp) throw new AppError('Competency not found', 404)

        if (title || canDo) {
            await prisma.competency.update({
                where: { id: comp.id },
                data: {
                    ...(title ? { title: String(title) } : {}),
                    ...(canDo ? { canDo: String(canDo) } : {}),
                },
            })
        }

        const lang = await prisma.language.findFirst({ where: { code: 'es' } })
        if (lang && (grammarNote || pronunciationNote || culturalNote)) {
            await prisma.languageRealization.upsert({
                where: { competencyId_languageId: { competencyId: comp.id, languageId: lang.id } },
                update: {
                    ...(grammarNote !== undefined ? { grammarNote: String(grammarNote) } : {}),
                    ...(pronunciationNote !== undefined ? { pronunciationNote: String(pronunciationNote) } : {}),
                    ...(culturalNote !== undefined ? { culturalNote: String(culturalNote) } : {}),
                },
                create: {
                    competencyId: comp.id,
                    languageId: lang.id,
                    grammarNote: grammarNote ? String(grammarNote) : null,
                    pronunciationNote: pronunciationNote ? String(pronunciationNote) : null,
                    culturalNote: culturalNote ? String(culturalNote) : null,
                },
            })
        }

        res.json({ ok: true })
    } catch (error) { next(error) }
})

/** Validate all phase content against DB (Phase 18 gate). */
router.post('/api/v1/admin/validate-content', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const comps = await prisma.competency.findMany({ select: { code: true } })
        const knownCodes = new Set(comps.map(c => String(c.code).trim()))
        const report = runContentValidation(phases, knownCodes)
        res.json(report)
    } catch (error) { next(error) }
})

router.post('/api/v1/admin/generate-flavor', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const parsed = generateSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid generation data', 400)

        const { mode, conceptName } = parsed.data

        let prompt = ''
        if (mode === 'STORY') {
            prompt = `Write EXACTLY one sentence (max 15 words) of story context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary.`
        } else if (mode === 'IMMERSION') {
            prompt = `Write EXACTLY one sentence (max 15 words) of cultural context for a Spanish lesson about "${conceptName}". Stay in-character.`
        } else if (mode === 'PROFESSIONAL') {
            prompt = `Write EXACTLY one sentence (max 15 words) of workplace context for a Spanish lesson about "${conceptName}". Stay in-character.`
        }

        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                { role: 'system', content: CONTENT_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 150,
        })

        res.json({ text: sanitizeAIOutput(completion.choices[0]?.message?.content ?? '') })
    } catch (error) { next(error) }
})

router.post('/api/v1/admin/generate-exercises', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const parsed = exerciseGenSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid generation data', 400)

        const { mode, conceptName, grammarNote, vocabItems } = parsed.data

        const prompt = `Generate exactly 3 exercises for a ${mode} mode Spanish Pre-A1 lesson.
Concept: "${conceptName}"
Rule: ${grammarNote}
Vocab: ${vocabItems.map((v: any) => v.word).join(', ')}
Return ONLY a valid JSON array of exercises.`

        const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                { role: 'system', content: CONTENT_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        let text = completion.choices[0]?.message?.content ?? '[]'
        text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        let exercises: any[] = []
        try { exercises = JSON.parse(text) } catch { exercises = [] }
        if (Array.isArray(exercises)) {
            exercises = exercises.map((ex: any) => ({ ...ex, prompt: sanitizeAIOutput(ex.prompt ?? '') }))
        }

        res.json({ exercises })
    } catch (error) { next(error) }
})

export default router
