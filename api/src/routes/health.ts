import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/api/v1/health', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
    } catch {
        res.status(503).json({ status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() })
    }
})

export default router