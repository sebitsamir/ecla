import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { clerkMiddleware, getAuth } from '@clerk/express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Prisma Client 
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
})

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

// Sync user from Clerk to database
app.post('/api/v1/sync-user', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        const email = (req.auth?.sessionClaims?.email as string) || 'unknown'

        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { email },
            create: { clerkId: userId, email },
        })

        res.json({
            synced: true,
            user,
            onboardingCompleted: user.onboardingCompleted,
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
            select: { id: true, preferredMode: true, dailyGoalXp: true, streakDays: true }
        })
        if (!user) throw new AppError('User not found', 404)

        const today = new Date().toISOString().split('T')[0]
        const todayLog = await prisma.streakLog.findUnique({
            where: { userId_date: { userId: user.id, date: today } }
        })
        const dailyXp = todayLog?.xpEarned || 0

        // Fetch ALL concepts to find the true "next" one
        const allConcepts = await prisma.concept.findMany({
            where: { unit: { course: { isPublished: true } } },
            orderBy: { orderIndex: 'asc' },
            include: {
                variants: { where: { mode: user.preferredMode } },
                mastery: { where: { userId: user.id } },
                progress: { where: { userId: user.id, status: 'completed' } }
            },
        })

        // 1. Find first uncompleted concept
        let nextConcept = allConcepts.find(c => c.progress.length === 0)

        // 2. If all are completed, find one that is struggling (accuracy < 80%)
        if (!nextConcept) {
            nextConcept = allConcepts.find(c => {
                const m = c.mastery[0]
                const total = (m?.correctCount || 0) + (m?.incorrectCount || 0)
                const acc = total > 0 ? m!.correctCount / total : 1
                return total >= 2 && acc < 0.8
            })
        }

        // 3. Fallback to first concept if everything is mastered
        if (!nextConcept && allConcepts.length > 0) {
            nextConcept = allConcepts[0]
        }

        if (!nextConcept || nextConcept.variants.length === 0) {
            return res.json({
                dailyXp, dailyGoalXp: user.dailyGoalXp, streakDays: user.streakDays,
                preferredMode: user.preferredMode, nextLesson: null, reviewRequired: false, accuracy: 100
            })
        }

        // Calculate Review Required (Adaptive Engine)
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
                mode: user.preferredMode,
                variant: nextConcept.variants[0],
            },
            reviewRequired,
            accuracy: Math.round(accuracy * 100),
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
            select: { preferredMode: true },
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
                variant: concept.variants[0],
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
                                variants: { where: { mode: user.preferredMode }, select: { id: true } },
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
                const accuracy = totalAttempts > 0 ? (mastery!.correctCount / totalAttempts) : 0

                let status: 'mastered' | 'struggling' | 'in_progress' | 'not_started' = 'not_started'
                if (totalAttempts === 0) status = 'not_started'
                else if (accuracy >= 0.8) status = 'mastered'
                else if (accuracy < 0.6) status = 'struggling'
                else status = 'in_progress'

                return {
                    id: concept.id,
                    name: concept.name,
                    xpReward: concept.xpReward,
                    isAvailable: concept.variants.length > 0,
                    status,
                    accuracy: Math.round(accuracy * 100),
                }
            }),
        }))

        res.json({ units })
    } catch (error) {
        next(error)
    }
})

// Complete Lesson & Update Mastery 
app.post('/api/v1/lessons/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // FIX: Added Auth check and Zod parsing
        const userId = requireAuth(req)
        const parsed = lessonCompleteSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid completion data', 400)

        const { conceptId, mode, correctCount, incorrectCount, xpEarned } = parsed.data

        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) throw new AppError('User not found', 404)

        // 1. Record the session progress
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

        // 2. Update Concept Mastery
        await prisma.conceptMastery.upsert({
            where: { userId_conceptId: { userId: user.id, conceptId } },
            update: {
                correctCount: { increment: correctCount },
                incorrectCount: { increment: incorrectCount },
                lastSeenAt: new Date(),
            },
            create: { userId: user.id, conceptId, correctCount, incorrectCount },
        })

        // 3. Handle Daily Streak Logic
        const today = new Date().toISOString().split('T')[0] // "YYYY-MM-DD"
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // FIX: Check if today's log exists BEFORE upserting it
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
            // This is the first lesson of the day
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

// FIX: Added the Mode Switcher Route
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

// 404 Handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error Handler (must be last)
app.use(errorHandler)

// Start Server
const PORT = parseInt(process.env.PORT || '4000', 10)

app.listen(PORT, () => {
    console.log(`Fluenta API running on http://localhost:${PORT}`)
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