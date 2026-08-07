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
            select: { preferredMode: true }
        })

        if (!user) {
            throw new AppError('User not found', 404)
        }

        // Find the first published concept and ONLY fetch the variant for the user's preferred mode
        const nextConcept = await prisma.concept.findFirst({
            where: { unit: { course: { isPublished: true } } },
            orderBy: { orderIndex: 'asc' },
            include: {
                variants: {
                    where: { mode: user.preferredMode },
                },
            },
        })

        if (!nextConcept || nextConcept.variants.length === 0) {
            return res.json({ nextLesson: null, message: 'No lessons available yet.' })
        }

        res.json({
            nextLesson: {
                conceptId: nextConcept.id,
                conceptName: nextConcept.name,
                mode: user.preferredMode,
                variant: nextConcept.variants[0],
            },
        })
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