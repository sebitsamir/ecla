import { Router, type NextFunction, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUser } from '../lib/auth'
import { AdaptationService } from '../adaptation/service'

const router = Router()
const service = new AdaptationService(prisma)

router.get('/api/v1/adaptation/plan', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUser(req)
        res.json(await service.plan(user.id))
    } catch (error) { next(error) }
})

export default router
