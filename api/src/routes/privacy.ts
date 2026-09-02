import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { getOrSyncUser, invalidateUserCache } from '../lib/auth'
import { AppError } from '../lib/errors'
import { deleteLearningData, exportLearningData } from '../privacy/service'

const router = Router()

router.get('/api/v1/privacy/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUser(req)
        res.setHeader('Content-Disposition', 'attachment; filename="ecla-learning-data.json"')
        res.json(await exportLearningData(prisma, user))
    } catch (error) { next(error) }
})

router.delete('/api/v1/privacy/learning-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.object({ confirmation: z.literal('DELETE MY LEARNING DATA') }).strict().safeParse(req.body)
        if (!parsed.success) throw new AppError('Exact deletion confirmation is required', 400)
        const user = await getOrSyncUser(req)
        await deleteLearningData(prisma, user)
        invalidateUserCache(user.clerkId)
        res.json({ deleted: true, scope: 'learning_data', accountIdentityRetained: true })
    } catch (error) { next(error) }
})

export default router
