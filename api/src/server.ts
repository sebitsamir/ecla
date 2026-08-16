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

const app = express()

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '1mb' }))
app.use(clerkMiddleware())

if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
        next()
    })
}

// Mount all routes
app.use(healthRoutes)
app.use(userRoutes)
app.use(dashboardRoutes)
app.use(lessonsRoutes)
app.use(courseRoutes)
app.use(flashcardsRoutes)
app.use(chatRoutes)
app.use(adminRoutes)

// 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error handler
function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    console.error('[ERROR]', err)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message })
    }
    return res.status(500).json({ error: 'Internal server error' })
}
app.use(errorHandler)

const PORT = parseInt(process.env.PORT || '4000', 10)
app.listen(PORT, () => {
    console.log(`ecla API running on http://localhost:${PORT}`)
})

// Graceful shutdown
import { prisma } from './lib/prisma'

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