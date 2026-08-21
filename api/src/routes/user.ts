import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { AppError } from '../lib/errors'
import { onboardingSchema, modeSchema } from '../lib/schemas'

const router = Router()

router.post('/api/v1/sync-user', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        res.json({ synced: true, user, onboardingCompleted: user.onboardingCompleted })
    } catch (error) { next(error) }
})

router.post('/api/v1/onboarding/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = require('../lib/auth').requireAuth(req)
        await getOrSyncUserFast(req)

        const parsed = onboardingSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid onboarding data', 400)

        const { motivation, preferredMode, dailyGoalXp, currentLevel } = parsed.data

        const user = await prisma.user.update({
            where: { clerkId: userId },
            data: {
                motivation,
                preferredMode,
                dailyGoalXp,
                currentLevel: currentLevel ?? null,
                onboardingCompleted: true,
            },
        })

        res.json({
            success: true,
            user: {
                id: user.id,
                motivation: user.motivation,
                preferredMode: user.preferredMode,
                dailyGoalXp: user.dailyGoalXp,
                currentLevel: user.currentLevel,
                onboardingCompleted: user.onboardingCompleted,
            },
        })
    } catch (error) { next(error) }
})

router.post('/api/v1/user/mode', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = modeSchema.safeParse(req.body)
        if (!parsed.success) throw new AppError('Invalid mode', 400)

        const user = await getOrSyncUserFast(req)
        await prisma.user.update({ where: { id: user.id }, data: { preferredMode: parsed.data.mode } })

        res.json({ success: true })
    } catch (error) { next(error) }
})

router.post('/api/v1/user/cosmetics/equip', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cosmeticId } = req.body
        if (typeof cosmeticId !== 'string') throw new AppError('Invalid cosmetic', 400)

        const user = await getOrSyncUserFast(req)
        if (!(user.unlockedCosmetics ?? ['gold']).includes(cosmeticId)) {
            throw new AppError('Cosmetic not unlocked yet', 403)
        }

        await prisma.user.update({ where: { id: user.id }, data: { equippedCosmetic: cosmeticId } })
        res.json({ success: true })
    } catch (error) { next(error) }
})

router.get('/api/v1/user/cosmetics', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        res.json({
            unlockedCosmetics: user.unlockedCosmetics ?? ['gold'],
            equippedCosmetic: user.equippedCosmetic ?? 'gold',
        })
    } catch (error) { next(error) }
})

export default router