import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { runtimeState } from '../lib/runtimeState'

const router = Router()

router.get('/api/v1/health/live', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const readiness = async (_req: Request, res: Response) => {
    if (!runtimeState.isReady()) return res.status(503).json({ status: 'draining', database: 'unknown', timestamp: new Date().toISOString() })
    try {
        await prisma.$queryRaw`SELECT 1`
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
    } catch {
        res.status(503).json({ status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() })
    }
}
router.get('/api/v1/health/ready', readiness)
router.get('/api/v1/health', readiness)

export default router
