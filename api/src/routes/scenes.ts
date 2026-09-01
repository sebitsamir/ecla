import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { ScenePlatform } from '../scenes/platform'
const router = Router()
const platform = new ScenePlatform(prisma)
router.get('/api/v1/scenes/:slug', async (req, res, next) => {
    try { res.set('Cache-Control', 'no-store').json(await platform.delivery(String(req.params.slug))) } catch (error) { next(error) }
})
router.get('/api/v1/scenes', async (req, res, next) => {
    try { res.set('Cache-Control', 'no-store').json({ scenes: await platform.catalog(typeof req.query.competencyId === 'string' ? req.query.competencyId : undefined) }) } catch (error) { next(error) }
})
export default router
