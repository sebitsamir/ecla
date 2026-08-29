/**
 * Learner memory — Phase 9 + 31: living world persistence.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

const CAST_META: Record<string, { personality: string; occupation: string; location: string }> = {
    sofia: { personality: 'warm, patient', occupation: 'barista', location: 'café' },
    marta: { personality: 'friendly, direct', occupation: 'neighbor', location: 'street' },
    daniel: { personality: 'curious, upbeat', occupation: 'student', location: 'classroom' },
    luis: { personality: 'practical, helpful', occupation: 'shopkeeper', location: 'shop' },
    ana: { personality: 'professional, calm', occupation: 'receptionist', location: 'workplace' },
}

function relationshipFor(encounters: number): string {
    if (encounters >= 7) return 'friend'
    if (encounters >= 3) return 'acquaintance'
    return 'stranger'
}

router.get('/api/v1/learner/memory', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const characters = await prisma.characterMemory.findMany({
            where: { userId: user.id },
            orderBy: { lastMetAt: 'desc' },
        })
        res.json({
            name: user.displayName ?? null,
            characters: characters.map(c => ({
                ...c,
                meta: CAST_META[c.characterId] ?? null,
            })),
        })
    } catch (error) { next(error) }
})

router.post('/api/v1/learner/memory/encounter', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { characterId, learnerName, moment } = (req.body ?? {}) as {
            characterId?: string
            learnerName?: string
            moment?: string
        }

        if (typeof characterId === 'string' && characterId) {
            const meta = CAST_META[characterId]
            const existing = await prisma.characterMemory.findUnique({
                where: { userId_characterId: { userId: user.id, characterId } },
            })
            const encounters = (existing?.encounters ?? 0) + 1
            const memories = Array.isArray(existing?.memories) ? [...(existing.memories as string[])] : []
            if (moment?.trim()) memories.push(moment.trim().slice(0, 120))

            await prisma.characterMemory.upsert({
                where: { userId_characterId: { userId: user.id, characterId } },
                update: {
                    encounters: { increment: 1 },
                    lastMetAt: new Date(),
                    relationship: relationshipFor(encounters),
                    memories: memories.slice(-10),
                },
                create: {
                    userId: user.id,
                    characterId,
                    encounters: 1,
                    personality: meta?.personality,
                    occupation: meta?.occupation,
                    location: meta?.location,
                    relationship: 'stranger',
                    memories: moment ? [moment.slice(0, 120)] : [],
                },
            })
        }

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
