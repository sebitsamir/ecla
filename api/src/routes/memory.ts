/**
 * Learner memory — the "living world" persistence layer (Phase 9).
 * GET  /api/v1/learner/memory            → name + character encounter history
 * POST /api/v1/learner/memory/encounter  → record a meeting / save the learner's name
 *
 * Characters remember the learner (spec §lesson_player 7):
 * encounters > 0 + known name → reunion greetings in scenes.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

router.get('/api/v1/learner/memory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const characters = await prisma.characterMemory.findMany({
            where: { userId: user.id },
            orderBy: { lastMetAt: 'desc' },
        })
        res.json({
            name: (user as any).displayName ?? null,
            characters,
        })
    } catch (error) { next(error) }
})

router.post('/api/v1/learner/memory/encounter', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { characterId, learnerName } = (req.body ?? {}) as { characterId?: string; learnerName?: string }

        if (typeof characterId === 'string' && characterId) {
            await prisma.characterMemory.upsert({
                where: { userId_characterId: { userId: user.id, characterId } },
                update: { encounters: { increment: 1 }, lastMetAt: new Date() },
                create: { userId: user.id, characterId, encounters: 1 },
            })
        }

        // The learner's own name, captured from "Me llamo …" (never asked for in a form).
        if (typeof learnerName === 'string' && learnerName.trim()) {
            await prisma.user.update({
                where: { id: user.id },
                data: { displayName: learnerName.trim().slice(0, 40) },
            })
        }

        res.json({ ok: true })
    } catch (error) { next(error) }
})

export default router