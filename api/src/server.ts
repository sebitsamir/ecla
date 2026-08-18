import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { AppError } from './lib/errors'

import healthRoutes from './routes/health'
import userRoutes from './routes/user'
import dashboardRoutes from './routes/dashboard'
import lessonsRoutes from './routes/lessons'
import courseRoutes from './routes/course'
import flashcardsRoutes from './routes/flashcards'
import chatRoutes from './routes/chat'
import adminRoutes from './routes/admin'
import voiceRoutes from './routes/voice'

const app = express()

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    maxAge: 86400,
}))

// JSON body — voice route uses its own raw parser (15mb), so this limit is for API payloads only
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false, limit: '2mb' }))
app.use(clerkMiddleware())

if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
        next()
    })
}

// Trust reverse proxy (Railway, Vercel, Fly) so req.ip works correctly
app.set('trust proxy', 1)

// ── Mount all routes ──
app.use(healthRoutes)
app.use(userRoutes)
app.use(dashboardRoutes)
app.use(lessonsRoutes)
app.use(courseRoutes)
app.use(flashcardsRoutes)
app.use(chatRoutes)
app.use(adminRoutes)
app.use(voiceRoutes)

// 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error handler — must be after all routes
function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    // Log with request context for easier debugging
    console.error(
        `[ERROR] ${req.method} ${req.path} —`,
        err instanceof AppError ? `${err.statusCode} ${err.message}` : err.message
    )
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack)
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message })
    }

    // Handle common Express body-parser errors gracefully
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Malformed JSON body' })
    }
    if ((err as any)?.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body too large' })
    }

    return res.status(500).json({ error: 'Internal server error' })
}
app.use(errorHandler)

const PORT = parseInt(process.env.PORT || '4000', 10)
const HOST = process.env.HOST || '0.0.0.0'

const server = app.listen(PORT, HOST, () => {
    console.log(`ecla API running on http://${HOST}:${PORT}`)
})

// ── Graceful shutdown ──
import { prisma } from './lib/prisma'

let isShuttingDown = false

const shutdown = async (signal: string) => {
    if (isShuttingDown) return
    isShuttingDown = true
    console.log(`\n${signal} received. Draining connections...`)

    // Stop accepting new connections
    server.close(() => {
        console.log('HTTP server closed.')
    })

    // Disconnect Prisma (wait up to 5s)
    try {
        await Promise.race([
            prisma.$disconnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma timeout')), 5000)),
        ])
        console.log('Prisma disconnected.')
    } catch (e) {
        console.error('Prisma disconnect failed:', e)
    }

    process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Catch unhandled rejections so the server doesn't die silently
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason)
})

process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err)
    process.exit(1)
})