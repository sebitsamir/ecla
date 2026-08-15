import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { clerkMiddleware, getAuth } from '@clerk/express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import Groq from 'groq-sdk'

// Prisma Client 
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
})

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Express App 
const app = express()

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

app.use(express.json({ limit: '1mb' }))
app.use(clerkMiddleware())

// Request Logging (Development)
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
        next()
    })
}

// Validation Schemas 
const onboardingSchema = z.object({
    motivation: z.enum(['TRAVEL', 'HERITAGE', 'CAREER', 'FUN']),
    preferredMode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
    dailyGoalXp: z.number().int().min(1).max(1000),
    currentLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).optional(),
})

const lessonCompleteSchema = z.object({
    conceptId: z.string(),
    mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
    correctCount: z.number().int().min(0),
    incorrectCount: z.number().int().min(0),
    xpEarned: z.number().int().min(0).max(100),
})

const modeSchema = z.object({
    mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
})

// Error Handler
class AppError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.name = 'AppError'
    }
}

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    console.error('[ERROR]', err)

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message })
    }

    return res.status(500).json({ error: 'Internal server error' })
}

// Helper: Get Authenticated User ID
function requireAuth(req: Request): string {
    const { userId } = getAuth(req)
    if (!userId) {
        throw new AppError('Unauthorized', 401)
    }
    return userId
}

function requireAdmin(req: Request): string {
    const userId = requireAuth(req)
    if (userId !== process.env.ADMIN_CLERK_ID) {
        throw new AppError('Forbidden: Admin access only', 403)
    }
    return userId
}

// ---------- AI Content Safety ----------
const CONTENT_SYSTEM_PROMPT = `You are a content generator for a Spanish learning app. Output ONLY the requested content. Never describe what you are about to write. Never use phrases like "Here's a..." or "This is a...". Never include meta-commentary, explanations of your approach, or quotation marks wrapping the whole output.
Rules:
- Output raw text only, nothing else
- Max 15 words per sentence
- Natural, real-world register matching the requested mode
- If asked for a Professional Mode phrase: 1 sentence only, workplace-appropriate
- If asked for a Story Mode beat: 1-2 sentences, in-character, references the ongoing story
- Never output your reasoning, framing, or any wrapper text`

function sanitizeAIOutput(text: string | null): string | null {
    if (!text) return text
    let t = text.trim()
    // "Here's a ...:" style prefix (with colon)
    t = t.replace(/^(here'?s|this is|i'?ll (write|generate|provide|create))[^:\n]*:\s*/i, '')
    // Colon-less framing sentence mentioning meta words
    t = t.replace(/^(here'?s|this is)\b[^.!?]*\b(phrase|sentence|beat|context|example|register|setting|app|mode)\b[^.!?]*[.!?]?\s*/i, '')
    // Wrapping quotes
    t = t.replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '')
    return t.trim()
}

function cleanVariant(v: any) {
    if (!v) return v
    return {
        ...v,
        storyBeat: sanitizeAIOutput(v.storyBeat ?? null),
        culturalRef: sanitizeAIOutput(v.culturalRef ?? null),
        formalPhrase: sanitizeAIOutput(v.formalPhrase ?? null),
    }
}

// Routes

// Health check (public)
app.get('/api/v1/health', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
        })
    } catch {
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
        })
    }
})

// Sync user from Clerk to database (Handles Ghost Users & Provider Switching)
app.post('/api/v1/sync-user', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const email = (req.auth?.sessionClaims?.email as string) || 'unknown'

        let user = await prisma.user.findUnique({ where: { clerkId: userId } })

        if (user) {
            if (user.email !== email) {
                user = await prisma.user.update({ where: { id: user.id }, data: { email } })
            }
        } else {
            const ghostUser = await prisma.user.findUnique({ where: { email } })

            if (ghostUser) {
                user = await prisma.user.update({
                    where: { id: ghostUser.id },
                    data: {
                        clerkId: userId,
                        onboardingCompleted: false
                    }
                })
            } else {
                user = await prisma.user.create({
                    data: {
                        clerkId: userId,
                        email,
                        onboardingCompleted: false
                    }
                })
            }
        }

        res.json({
            synced: true,
            user,
            onboardingCompleted: user.onboardingCompleted
        })
    } catch (error) {
        next(error)
    }
})

// Complete onboarding
app.post('/api/v1/onboarding/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)

        const parsed = onboardingSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new AppError('Invalid onboarding data', 400)
        }

        const { motivation, preferredMode, dailyGoalXp, currentLevel } = parsed.data

        const user = await prisma.user.update({
            where: { clerkId: userId },
            data: {
                motivation,
                preferredMode,
                dailyGoalXp,
                currentLevel: currentLevel ?? null,
                onboardingCompleted: true,
            },
        })

        res.json({
            success: true,
            user: {
                id: user.id,
                motivation: user.motivation,
                preferredMode: user.preferredMode,
                dailyGoalXp: user.dailyGoalXp,
                currentLevel: user.currentLevel,
                onboardingCompleted: user.onboardingCompleted,
            },
        })
    } catch (error) {
        next(error)
    }
})

// Dashboard
app.get('/api/v1/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, preferredMode: true, dailyGoalXp: true, streakDays: true, unlockedCosmetics: true, equippedCosmetic: true }
        })
        if (!user) throw new AppError('User not found', 404)

        const today = new Date().toISOString().split('T')[0]
        const todayLog = await prisma.streakLog.findUnique({
            where: { userId_date: { userId: user.id, date: today } }
        })
        const dailyXp = todayLog?.xpEarned || 0

        const recentProgress = await prisma.userProgress.findMany({
            where: { userId: user.id },
            orderBy: { completedAt: 'desc' },
            take: 5,
        })
        let comboStreak = 0
        for (const p of recentProgress) {
            if (p.score === 0) break
            comboStreak += p.score
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeDays = await prisma.streakLog.count({
            where: {
                userId: user.id,
                date: { gte: thirtyDaysAgo.toISOString().split('T')[0] }
            }
        })

        let glowTier = 'Dim'
        let glowNext = 7
        if (activeDays >= 21) { glowTier = 'Brilliant'; glowNext = 0 }
        else if (activeDays >= 14) { glowTier = 'Radiant'; glowNext = 21 - activeDays }
        else if (activeDays >= 7) { glowTier = 'Warm'; glowNext = 14 - activeDays }
        else { glowTier = 'Dim'; glowNext = 7 - activeDays }

        const masteryRows = await prisma.conceptMastery.findMany({ where: { userId: user.id } })
        const masteredCount = masteryRows.filter(m => {
            const total = m.correctCount + m.incorrectCount
            return total >= 2 && m.correctCount / total >= 0.8
        }).length
        const lessonsDone = await prisma.userProgress.count({ where: { userId: user.id } })

        const conditions: Record<string, boolean> = {
            gold: true,
            coral: user.streakDays >= 3,
            aurora: masteredCount >= 5,
            moon: lessonsDone >= 10,
            violet: activeDays >= 14,
        }

        const currentUnlocked = user.unlockedCosmetics ?? ['gold']
        const newUnlocks = Object.keys(conditions).filter(id => conditions[id] && !currentUnlocked.includes(id))
        let unlockedCosmetics = currentUnlocked
        if (newUnlocks.length) {
            unlockedCosmetics = [...currentUnlocked, ...newUnlocks]
            await prisma.user.update({ where: { clerkId: userId }, data: { unlockedCosmetics } })
        }

        const allConcepts = await prisma.concept.findMany({
            where: { unit: { course: { isPublished: true } } },
            orderBy: { orderIndex: 'asc' },
            include: {
                variants: { where: { mode: user.preferredMode } },
                mastery: { where: { userId: user.id } },
                progress: { where: { userId: user.id, status: 'completed' } }
            },
        })

        let nextConcept = allConcepts.find(c => c.progress.length === 0)

        if (!nextConcept) {
            nextConcept = allConcepts.find(c => {
                const m = c.mastery[0]
                const total = (m?.correctCount || 0) + (m?.incorrectCount || 0)
                const acc = total > 0 ? m!.correctCount / total : 1
                return total >= 2 && acc < 0.8
            })
        }

        if (!nextConcept && allConcepts.length > 0) {
            nextConcept = allConcepts[0]
        }

        if (!nextConcept || nextConcept.variants.length === 0) {
            return res.json({
                dailyXp,
                dailyGoalXp: user.dailyGoalXp,
                streakDays: user.streakDays,
                preferredMode: user.preferredMode,
                nextLesson: null,
                reviewRequired: false,
                accuracy: 100,
                comboStreak,
                glowTier,
                glowNext,
                activeDays,
                unlockedCosmetics,
                equippedCosmetic: user.equippedCosmetic ?? 'gold',
                newUnlocks,
            })
        }

        const mastery = nextConcept.mastery[0]
        const totalAttempts = (mastery?.correctCount || 0) + (mastery?.incorrectCount || 0)
        const accuracy = totalAttempts > 0 ? (mastery!.correctCount / totalAttempts) : 1

        let reviewRequired = false
        if (totalAttempts >= 2 && accuracy < 0.6) {
            reviewRequired = true
        }

        res.json({
            dailyXp,
            dailyGoalXp: user.dailyGoalXp,
            streakDays: user.streakDays,
            preferredMode: user.preferredMode,
            nextLesson: {
                conceptId: nextConcept.id,
                conceptName: nextConcept.name,
                xpReward: nextConcept.xpReward,
                mode: user.preferredMode,
                variant: cleanVariant(nextConcept.variants[0]),
            },
            reviewRequired,
            accuracy: Math.round(accuracy * 100),
            comboStreak,
            glowTier,
            glowNext,
            activeDays,
            unlockedCosmetics,
            equippedCosmetic: user.equippedCosmetic ?? 'gold',
            newUnlocks,
        })
    } catch (error) {
        next(error)
    }
})

// Fetch Specific Lesson
app.get('/api/v1/lessons/:conceptId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const { conceptId } = req.params

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { preferredMode: true, equippedCosmetic: true },
        })
        if (!user) throw new AppError('User not found', 404)

        const concept = await prisma.concept.findUnique({
            where: { id: conceptId },
            include: {
                variants: {
                    where: { mode: user.preferredMode },
                },
            },
        })

        if (!concept || concept.variants.length === 0) {
            throw new AppError('Lesson not found or not available in your preferred mode', 404)
        }

        res.json({
            lesson: {
                conceptId: concept.id,
                conceptName: concept.name,
                grammarNote: concept.grammarNote,
                mode: user.preferredMode,
                variant: cleanVariant(concept.variants[0]),
                equippedCosmetic: user.equippedCosmetic ?? 'gold',
            },
        })
    } catch (error) {
        next(error)
    }
})

// Curriculum Map 
app.get('/api/v1/course/map', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)

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
                    id: concept.id,
                    name: concept.name,
                    xpReward: concept.xpReward,
                    grammarNote: concept.grammarNote,
                    modes,
                    isAvailable: modes.includes(user.preferredMode),
                    status,
                    accuracy: Math.round(accuracy * 100),
                }
            }),
        }))

        res.json({ units, preferredMode: user.preferredMode })
    } catch (error) {
        next(error)
    }
})

// Complete Lesson & Update Mastery 
app.post('/api/v1/lessons/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const parsed = lessonCompleteSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid completion data', 400)

        const { conceptId, mode, correctCount, incorrectCount, xpEarned } = parsed.data

        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)

        await prisma.userProgress.create({
            data: {
                userId: user.id,
                conceptId,
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
            update: {
                xpEarned: { increment: xpEarned },
                lessonsDone: { increment: 1 },
            },
            create: {
                userId: user.id,
                date: today,
                xpEarned,
                lessonsDone: 1,
            },
        })

        let newStreakDays = user.streakDays
        if (!existingTodayLog) {
            const yesterdayLog = await prisma.streakLog.findUnique({
                where: { userId_date: { userId: user.id, date: yesterday } }
            })
            newStreakDays = yesterdayLog ? user.streakDays + 1 : 1
        }

        const updatedUser = await prisma.user.update({
            where: { clerkId: userId },
            data: {
                xpTotal: { increment: xpEarned },
                streakDays: newStreakDays,
                lastActiveAt: new Date(),
            },
        })

        res.json({ success: true, newXpTotal: updatedUser.xpTotal, newStreak: newStreakDays })
    } catch (error) {
        next(error)
    }
})

// Mode Switcher Route
app.post('/api/v1/user/mode', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const parsed = modeSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid mode', 400)

        await prisma.user.update({
            where: { clerkId: userId },
            data: { preferredMode: parsed.data.mode },
        })

        res.json({ success: true })
    } catch (error) {
        next(error)
    }
})

// Equip Cosmetic
app.post('/api/v1/user/cosmetics/equip', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const { cosmeticId } = req.body
        if (typeof cosmeticId !== 'string') throw new AppError('Invalid cosmetic', 400)

        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)
        if (!(user.unlockedCosmetics ?? ['gold']).includes(cosmeticId)) {
            throw new AppError('Cosmetic not unlocked yet', 403)
        }

        await prisma.user.update({ where: { clerkId: userId }, data: { equippedCosmetic: cosmeticId } })
        res.json({ success: true })
    } catch (error) { next(error) }
})

// Get Cosmetics (unlocked + equipped)
app.get('/api/v1/user/cosmetics', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { unlockedCosmetics: true, equippedCosmetic: true },
        })
        if (!user) throw new AppError('User not found', 404)
        res.json({
            unlockedCosmetics: user.unlockedCosmetics ?? ['gold'],
            equippedCosmetic: user.equippedCosmetic ?? 'gold',
        })
    } catch (error) { next(error) }
})

// Fetch Due Flashcards
app.get('/api/v1/flashcards/due', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)

        const now = new Date()

        const allVocab = await prisma.vocabulary.findMany({
            where: { courseId: 'course-spanish-a1' }
        })

        const progress = await prisma.userVocabProgress.findMany({
            where: {
                userId: user.id,
                vocabId: { in: allVocab.map(v => v.id) }
            }
        })

        const dueCards = allVocab.map(vocab => {
            const prog = progress.find(p => p.vocabId === vocab.id)

            if (!prog || prog.nextReviewAt <= now) {
                return {
                    id: vocab.id,
                    word: vocab.word,
                    translation: vocab.translation,
                    progress: prog || null
                }
            }
            return null
        }).filter(Boolean)

        res.json({ cards: dueCards.slice(0, 20) })
    } catch (error) {
        next(error)
    }
})

// Process Flashcard Review (SM-2 Algorithm)
const flashcardReviewSchema = z.object({
    vocabId: z.string(),
    quality: z.number().int().min(0).max(5),
})

app.post('/api/v1/flashcards/review', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const parsed = flashcardReviewSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid review data', 400)

        const { vocabId, quality } = parsed.data
        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)

        let prog = await prisma.userVocabProgress.findFirst({
            where: { userId: user.id, vocabId }
        })

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

        await prisma.userVocabProgress.upsert({
            where: { id: prog?.id || 'new-record' },
            update: { easeFactor, interval, repetitions, nextReviewAt },
            create: {
                userId: user.id,
                vocabId,
                easeFactor,
                interval,
                repetitions,
                nextReviewAt,
            },
        })

        res.json({ success: true, nextReviewInDays: interval })
    } catch (error) {
        next(error)
    }
})

// AI Chat Tutor
const chatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
    })).min(1).max(30),
})

const motivationHints: Record<string, string> = {
    TRAVEL: 'Focus on practical travel situations: airports, restaurants, directions, hotels.',
    HERITAGE: 'Focus on family, relationships, and emotional vocabulary.',
    CAREER: 'Focus on professional and workplace conversations.',
    FUN: 'Keep it playful. Use humor and casual topics.',
}

app.post('/api/v1/chat', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const parsed = chatSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid chat data', 400)

        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)

        const level = user.currentLevel ?? 'A1'
        const motivation = user.motivation ?? 'FUN'

        const systemPrompt = `You are the ecla AI Spanish tutor.
The student's CEFR level is ${level}. Their motivation is: ${motivation}. ${motivationHints[motivation] ?? ''}
Rules:
- Reply mostly in Spanish, using vocabulary and grammar appropriate for level ${level}. For A1/A2 use short, simple sentences.
- If the level is A1 or A2, add a brief English translation in parentheses after your Spanish reply.
- If the student makes a mistake, gently restate the correct sentence. Never be punishing.
- Keep every reply under 80 words.
- Be warm, encouraging, and a little fun.`

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...parsed.data.messages.map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 300,
        })

        res.json({ reply: completion.choices[0]?.message?.content ?? '...' })
    } catch (error) {
        next(error)
    }
})

// Admin: List Concepts
app.get('/api/v1/admin/concepts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const concepts = await prisma.concept.findMany({
            orderBy: { orderIndex: 'asc' },
            include: { variants: true, unit: true },
        })
        res.json({ concepts })
    } catch (error) { next(error) }
})

// Admin: Create/Update Concept & Variants
const conceptSchema = z.object({
    id: z.string().optional(),
    unitId: z.string(),
    name: z.string().min(1),
    cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
    grammarNote: z.string().min(1),
    vocabItems: z.any(),
    orderIndex: z.number().int(),
    xpReward: z.number().int(),
    variants: z.array(z.object({
        mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
        storyBeat: z.string().nullable(),
        culturalRef: z.string().nullable(),
        formalPhrase: z.string().nullable(),
        exercises: z.any(),
    }))
})

app.post('/api/v1/admin/concepts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const parsed = conceptSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid concept data', 400)

        const data = parsed.data

        // Sanitize variants before saving
        const cleanVariants = data.variants.map(v => ({
            ...v,
            storyBeat: sanitizeAIOutput(v.storyBeat),
            culturalRef: sanitizeAIOutput(v.culturalRef),
            formalPhrase: sanitizeAIOutput(v.formalPhrase),
        }))

        if (data.id) {
            await prisma.concept.update({
                where: { id: data.id },
                data: {
                    unitId: data.unitId, name: data.name, cefrLevel: data.cefrLevel,
                    grammarNote: data.grammarNote, vocabItems: data.vocabItems,
                    orderIndex: data.orderIndex, xpReward: data.xpReward,
                },
            })
            for (const v of cleanVariants) {
                await prisma.lessonVariant.upsert({
                    where: { conceptId_mode: { conceptId: data.id, mode: v.mode } },
                    update: { storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises },
                    create: { conceptId: data.id, mode: v.mode, storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises },
                })
            }
        } else {
            const concept = await prisma.concept.create({
                data: {
                    id: `concept-${Date.now()}`,
                    unitId: data.unitId, name: data.name, cefrLevel: data.cefrLevel,
                    grammarNote: data.grammarNote, vocabItems: data.vocabItems,
                    orderIndex: data.orderIndex, xpReward: data.xpReward,
                },
            })
            for (const v of cleanVariants) {
                await prisma.lessonVariant.create({
                    data: { conceptId: concept.id, mode: v.mode, storyBeat: v.storyBeat, culturalRef: v.culturalRef, formalPhrase: v.formalPhrase, exercises: v.exercises },
                })
            }
        }

        res.json({ success: true })
    } catch (error) { next(error) }
})

// Admin: AI Flavor Generator
const generateSchema = z.object({
    mode: z.enum(['STORY', 'IMMERSION', 'PROFESSIONAL']),
    conceptName: z.string(),
    grammarNote: z.string(),
    vocabItems: z.any(),
})

app.post('/api/v1/admin/generate-flavor', async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireAdmin(req)
        const parsed = generateSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid generation data', 400)

        const { mode, conceptName, grammarNote, vocabItems } = parsed.data

        let prompt = ""
        if (mode === 'STORY') {
            prompt = `Write EXACTLY one sentence (max 15 words) of story context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary. No self-reference.`
        } else if (mode === 'IMMERSION') {
            prompt = `Write EXACTLY one sentence (max 15 words) of cultural context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary.`
        } else if (mode === 'PROFESSIONAL') {
            prompt = `Write EXACTLY one sentence (max 15 words) of workplace context for a Spanish lesson about "${conceptName}". Stay in-character. No meta-commentary.`
        }

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
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

// Admin: AI Exercise Generator
const exerciseGenSchema = z.object({
    mode: z.enum(['STORY', 'DRILL', 'IMMERSION', 'PROFESSIONAL']),
    conceptName: z.string(),
    grammarNote: z.string(),
    vocabItems: z.any(),
})

app.post('/api/v1/admin/generate-exercises', async (req: Request, res: Response, next: NextFunction) => {
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
            model: 'llama-3.1-8b-instant',
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

// 404 Handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error Handler (must be last)
app.use(errorHandler)

// Start Server
const PORT = parseInt(process.env.PORT || '4000', 10)

app.listen(PORT, () => {
    console.log(`ecla API running on http://localhost:${PORT}`)
})

// Graceful Shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...')
    await prisma.$disconnect()
    process.exit(0)
})

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...')
    await prisma.$disconnect()
    process.exit(0)
})