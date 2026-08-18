import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { groq } from '../lib/groq'
import { requireAdmin } from '../lib/auth'
import { AppError } from '../lib/errors'
import { sanitizeAIOutput, CONTENT_SYSTEM_PROMPT } from '../lib/ai'
import { conceptSchema, generateSchema, exerciseGenSchema } from '../lib/schemas'

const router = Router()

router.get('/api/v1/admin/concepts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const concepts = await prisma.concept.findMany({
            orderBy: { orderIndex: 'asc' },
            include: { 
                variants: true, 
                unit: true,
                subLessons: { orderBy: { orderIndex: 'asc' } },
            },
        })
        res.json({ concepts })
    } catch (error) { next(error) }
})

router.post('/api/v1/admin/concepts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)

        // Extract subLessons BEFORE zod parse strips unknown fields
        const subLessonsRaw = req.body.subLessons as any[] | undefined

        const parsed = conceptSchema.safeParse(req.body)
        if (!parsed.success) {
            console.error('Zod validation errors:', parsed.error.flatten())
            throw new AppError('Invalid concept data', 400)
        }

        const data = parsed.data
        const cleanVariants = data.variants.map(v => ({
            ...v,
            storyBeat: sanitizeAIOutput(v.storyBeat),
            culturalRef: sanitizeAIOutput(v.culturalRef),
            formalPhrase: sanitizeAIOutput(v.formalPhrase),
        }))

        let conceptId: string

        if (data.id) {
            // ─── UPDATE EXISTING CONCEPT ───
            await prisma.concept.update({
                where: { id: data.id },
                data: {
                    unitId: data.unitId, name: data.name, cefrLevel: data.cefrLevel,
                    grammarNote: data.grammarNote, vocabItems: data.vocabItems,
                    orderIndex: data.orderIndex, xpReward: data.xpReward,
                },
            })
            conceptId = data.id

            // Upsert variants
            for (const v of cleanVariants) {
                await prisma.lessonVariant.upsert({
                    where: { conceptId_mode: { conceptId: data.id, mode: v.mode } },
                    update: { 
                        storyBeat: v.storyBeat, 
                        culturalRef: v.culturalRef, 
                        formalPhrase: v.formalPhrase, 
                        exercises: v.exercises 
                    },
                    create: { 
                        conceptId: data.id, mode: v.mode, 
                        storyBeat: v.storyBeat, culturalRef: v.culturalRef, 
                        formalPhrase: v.formalPhrase, exercises: v.exercises 
                    },
                })
            }
        } else {
            // ─── CREATE NEW CONCEPT ───
            const concept = await prisma.concept.create({
                data: {
                    id: `concept-${Date.now()}`,
                    unitId: data.unitId, name: data.name, cefrLevel: data.cefrLevel,
                    grammarNote: data.grammarNote, vocabItems: data.vocabItems,
                    orderIndex: data.orderIndex, xpReward: data.xpReward,
                },
            })
            conceptId = concept.id

            // Create variants
            for (const v of cleanVariants) {
                await prisma.lessonVariant.create({
                    data: { 
                        conceptId: concept.id, mode: v.mode, 
                        storyBeat: v.storyBeat, culturalRef: v.culturalRef, 
                        formalPhrase: v.formalPhrase, exercises: v.exercises 
                    },
                })
            }
        }

        // ─── SUB-LESSONS (4-part structure) ───
        if (Array.isArray(subLessonsRaw) && subLessonsRaw.length > 0) {
            // Delete existing sub-lessons for this concept to prevent orphans
            await prisma.subLesson.deleteMany({ where: { conceptId } })

            // Insert new sub-lessons in order
            for (let i = 0; i < subLessonsRaw.length; i++) {
                const sub = subLessonsRaw[i]
                if (!sub) continue

                await prisma.subLesson.create({
                    data: {
                        conceptId,
                        orderIndex: i,
                        title: sub.title || `Part ${i + 1}`,
                        icon: sub.icon || 'book-open',
                        xpReward: typeof sub.xpReward === 'number' ? sub.xpReward : 5,
                        teach: Array.isArray(sub.teach) ? sub.teach : [],
                        exercises: Array.isArray(sub.exercises) ? sub.exercises : [],
                        realLife: sub.realLife || null,
                    },
                })
            }
        }

        res.json({ success: true, conceptId })
    } catch (error) { next(error) }
})

router.post('/api/v1/admin/generate-flavor', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const parsed = generateSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid generation data', 400)

        const { mode, conceptName } = parsed.data

        let prompt = ""
        if (mode === 'STORY') {
            prompt = `Write EXACTLY one sentence (max 15 words) of story context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary. No self-reference.`
        } else if (mode === 'IMMERSION') {
            prompt = `Write EXACTLY one sentence (max 15 words) of cultural context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary.`
        } else if (mode === 'PROFESSIONAL') {
            prompt = `Write EXACTLY one sentence (max 15 words) of workplace context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary.`
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

        const prompt = `You are a Spanish language teacher. 
Concept: "${conceptName}"
Rule: ${grammarNote}
Vocab: ${vocabItems.map((v: any) => v.word).join(', ')}

Generate exactly 3 exercises for a ${mode} mode lesson. 
Types allowed: "mcq" (needs 'options' array), "fill_blank", or "translate".

Return ONLY a valid JSON array. Do not use markdown backticks. Do not add text outside the JSON.
Example format: [{"type":"mcq","prompt":"I eat","options":["Como","Comes"],"answer":"Como"}]`

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