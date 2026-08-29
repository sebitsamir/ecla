/**
 * Scene API — authoritative scene definitions from curriculum DB.
 * GET /api/v1/scenes/:slug
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { AppError } from '../lib/errors'

const router = Router()

router.get('/api/v1/scenes/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = String(req.params.slug)
        const scene = await prisma.scene.findUnique({
            where: { slug },
            include: {
                competency: {
                    select: { id: true, code: true, title: true, canDo: true },
                },
            },
        })
        if (!scene || !scene.isPublished) throw new AppError('Scene not found', 404)

        res.json({
            scene: {
                id: scene.id,
                slug: scene.slug,
                archetype: scene.archetype,
                title: scene.title,
                environment: scene.environment,
                timeOfDay: scene.timeOfDay,
                mood: scene.mood,
                objective: scene.objective,
                mission: scene.mission,
                context: scene.context,
                characters: scene.characters,
                language: scene.language,
                activities: scene.activities,
                variations: scene.variations,
                transfer: scene.transfer,
                assessment: scene.assessment,
                mastery: scene.mastery,
                metadata: scene.metadata,
                competency: scene.competency,
            },
        })
    } catch (error) { next(error) }
})

router.get('/api/v1/scenes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const competencyId = typeof req.query.competencyId === 'string' ? req.query.competencyId : undefined
        const scenes = await prisma.scene.findMany({
            where: {
                isPublished: true,
                ...(competencyId ? { competencyId } : {}),
            },
            select: {
                id: true,
                slug: true,
                archetype: true,
                title: true,
                environment: true,
                competencyId: true,
            },
            orderBy: { slug: 'asc' },
        })
        res.json({ scenes })
    } catch (error) { next(error) }
})

export default router
