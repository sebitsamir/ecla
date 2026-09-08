import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { AppError } from './lib/errors'
import { errorMessage, log, requestIdOf, requestObservability } from './lib/observability'
import { runtimeState } from './lib/runtimeState'

import healthRoutes from './routes/health'
import userRoutes from './routes/user'
import dashboardRoutes from './routes/dashboard'
import courseRoutes from './routes/course'
import flashcardsRoutes from './routes/flashcards'
import chatRoutes from './routes/chat'
import adminRoutes from './routes/admin'
import voiceRoutes from './routes/voice'
import learnerRoutes from './routes/learner'
import lessonsRoutes from './routes/lessons'
import adaptiveRoutes from './routes/adaptive'
import missionRoutes from './routes/missions'
import memoryRoutes from './routes/memory'
import gatewayRoutes from './routes/gateway'
import performanceRoutes from './routes/performance'
import transferRoutes from './routes/transfer'
import contentRoutes from './routes/content'
import scenesRoutes from './routes/scenes'
import attemptRoutes from './routes/attempts'
import scenePlatformRoutes from './routes/scenePlatform'
import assessmentRoutes from './routes/assessment'
import portfolioReviewRoutes from './routes/portfolioReviews'
import adaptationRoutes from './routes/adaptation'
import privacyRoutes from './routes/privacy'
import pilotRoutes from './routes/pilot'

const allowedOrigin =
    process.env.FRONTEND_URL ||
    process.env.APP_ORIGIN ||
    'http://localhost:3000'

const app = express()
app.disable('x-powered-by')
app.use(clerkMiddleware(
    process.env.NODE_ENV === 'production'
        ? { authorizedParties: [allowedOrigin] }
        : {},
))
app.use(requestObservability)
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=()')
    next()
})

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
    maxAge: 86400,
}))

// JSON body — voice route uses its own raw parser (15mb), so this limit is for API payloads only
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false, limit: '2mb' }))
// Trust reverse proxy (Railway, Vercel, Fly) so req.ip works correctly
app.set('trust proxy', 1)

// ── Mount all routes ──
app.use(healthRoutes)
app.use(userRoutes)
app.use(dashboardRoutes)
app.use(courseRoutes)
app.use(flashcardsRoutes)
app.use(chatRoutes)
app.use(adminRoutes)
app.use(voiceRoutes)
app.use(learnerRoutes)
app.use(lessonsRoutes)
app.use(adaptiveRoutes)
app.use(missionRoutes)
app.use(memoryRoutes)
app.use(gatewayRoutes)
app.use(contentRoutes)
app.use(scenesRoutes)
app.use(attemptRoutes)
app.use(scenePlatformRoutes)
app.use(assessmentRoutes)
app.use(portfolioReviewRoutes)
app.use(adaptationRoutes)
app.use(privacyRoutes)
app.use(pilotRoutes)
app.use(performanceRoutes)
app.use(transferRoutes)

// 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error handler — must be after all routes
function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    // Log with request context for easier debugging
    const requestId = requestIdOf(res)
    log('error', 'request_error', { requestId, method: req.method, path: req.path, status: err instanceof AppError ? err.statusCode : 500, error: errorMessage(err), ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}) })

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message, requestId })
    }

    // Handle common Express body-parser errors gracefully
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Malformed JSON body', requestId })
    }
    if ((err as any)?.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body too large', requestId })
    }

    return res.status(500).json({ error: 'Internal server error', requestId })
}
app.use(errorHandler)

const PORT = parseInt(process.env.PORT || '4000', 10)
const HOST = process.env.HOST || '0.0.0.0'

const server = app.listen(PORT, HOST, () => {
    log('info', 'server_started', { host: HOST, port: PORT, environment: process.env.NODE_ENV ?? 'development' })
})

// ── Graceful shutdown ──
import { prisma } from './lib/prisma'

let isShuttingDown = false

const shutdown = async (signal: string) => {
    if (isShuttingDown) return
    isShuttingDown = true
    runtimeState.beginShutdown()
    log('info', 'shutdown_started', { signal })

    // Stop accepting new connections
    server.close(() => {
        log('info', 'http_server_closed')
    })

    // Disconnect Prisma (wait up to 5s)
    try {
        await Promise.race([
            prisma.$disconnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma timeout')), 5000)),
        ])
        log('info', 'database_disconnected')
    } catch (e) {
        log('error', 'database_disconnect_failed', { error: errorMessage(e) })
    }

    process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Catch unhandled rejections so the server doesn't die silently
process.on('unhandledRejection', (reason) => {
    log('error', 'unhandled_rejection', { error: errorMessage(reason) })
})

process.on('uncaughtException', (err) => {
    log('error', 'uncaught_exception', { error: errorMessage(err) })
    process.exit(1)
})
