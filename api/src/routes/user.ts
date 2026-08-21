/**
 * User Routes: User Management & Preferences
 * 
 * This file handles all user-related API endpoints:
 * - User syncing (Clerk auth → database)
 * - Onboarding completion tracking
 * - Learning mode preferences
 * - Cosmetic management (unlock & equip)
 * 
 * Key Endpoints:
 * - GET /api/v1/users/me: Get current user data (includes onboarding status)
 * - POST /api/v1/sync-user: Sync Clerk user to database
 * - POST /api/v1/onboarding/complete: Mark onboarding as complete
 * - POST /api/v1/user/mode: Update learning mode preference
 * - POST /api/v1/user/cosmetics/equip: Equip a cosmetic
 * - GET /api/v1/user/cosmetics: Get user's cosmetics
 * 
 * Critical Integration:
 * The onboarding page calls GET /api/v1/users/me to check if onboarding
 * is already complete. If it is, the page redirects to dashboard immediately.
 * This prevents users from re-doing onboarding.
 * 
 * Auth Flow:
 * - All endpoints require Clerk JWT token
 * - getOrSyncUserFast() syncs Clerk user to database with caching
 * - requireAuth() extracts userId from JWT for operations that need it
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast, requireAuth } from '../lib/auth'
import { AppError } from '../lib/errors'
import { onboardingSchema, modeSchema } from '../lib/schemas'

const router = Router()

/**
 * GET /api/v1/users/me
 * 
 * Returns current user data including onboarding status.
 * 
 * This is CRITICAL for the onboarding flow:
 * - Onboarding page calls this on mount
 * - If onboardingCompleted is true, redirects to dashboard
 * - If onboardingCompleted is false, shows onboarding flow
 * 
 * Response includes:
 * - id: Database user ID
 * - email: User email from Clerk
 * - name: User name from Clerk
 * - onboardingCompleted: Boolean flag
 * - motivation: User's learning motivation
 * - preferredMode: User's learning mode preference
 * - dailyGoalXp: Daily XP target
 * - currentLevel: CEFR level (A1, A2, B1, B2, C1)
 * - unlockedCosmetics: Array of cosmetic IDs
 * - equippedCosmetic: Currently equipped cosmetic ID
 */
router.get('/api/v1/users/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            onboardingCompleted: user.onboardingCompleted,
            motivation: user.motivation,
            preferredMode: user.preferredMode,
            dailyGoalXp: user.dailyGoalXp,
            currentLevel: user.currentLevel,
            unlockedCosmetics: user.unlockedCosmetics ?? ['gold'],
            equippedCosmetic: user.equippedCosmetic ?? 'gold',
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/v1/sync-user
 * 
 * Manually trigger user sync from Clerk to database.
 * Used when you need to force a sync (e.g., after profile updates).
 * 
 * Returns synced user data including onboarding status.
 */
router.post('/api/v1/sync-user', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        res.json({ 
            synced: true, 
            user, 
            onboardingCompleted: user.onboardingCompleted 
        })
    } catch (error) { 
        next(error) 
    }
})

/**
 * POST /api/v1/onboarding/complete
 * 
 * Marks onboarding as complete and saves user preferences.
 * 
 * Request body (validated by onboardingSchema):
 * - motivation: 'TRAVEL' | 'HERITAGE' | 'CAREER' | 'FUN'
 * - preferredMode: 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL'
 * - dailyGoalXp: 20 | 50 | 100
 * - currentLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' (optional)
 * 
 * Updates user record:
 * - Sets onboardingCompleted: true
 * - Saves all preference fields
 * 
 * Response:
 * - success: true
 * - user: Updated user object
 */
router.post('/api/v1/onboarding/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = requireAuth(req)
        await getOrSyncUserFast(req)

        const parsed = onboardingSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new AppError('Invalid onboarding data', 400)
        }

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
    } catch (error) { 
        next(error) 
    }
})

/**
 * POST /api/v1/user/mode
 * 
 * Updates user's preferred learning mode.
 * Can be called anytime after onboarding.
 * 
 * Request body (validated by modeSchema):
 * - mode: 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL'
 * 
 * Response:
 * - success: true
 */
router.post('/api/v1/user/mode', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = modeSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new AppError('Invalid mode', 400)
        }

        const user = await getOrSyncUserFast(req)
        await prisma.user.update({ 
            where: { id: user.id }, 
            data: { preferredMode: parsed.data.mode } 
        })

        res.json({ success: true })
    } catch (error) { 
        next(error) 
    }
})

/**
 * POST /api/v1/user/cosmetics/equip
 * 
 * Equips a cosmetic (Firefly glow color).
 * User must have unlocked the cosmetic first.
 * 
 * Request body:
 * - cosmeticId: string (ID of cosmetic to equip)
 * 
 * Validation:
 * - Checks if cosmetic is in user's unlocked list
 * - Returns 403 if not unlocked
 * 
 * Response:
 * - success: true
 */
router.post('/api/v1/user/cosmetics/equip', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cosmeticId } = req.body
        if (typeof cosmeticId !== 'string') {
            throw new AppError('Invalid cosmetic', 400)
        }

        const user = await getOrSyncUserFast(req)
        if (!(user.unlockedCosmetics ?? ['gold']).includes(cosmeticId)) {
            throw new AppError('Cosmetic not unlocked yet', 403)
        }

        await prisma.user.update({ 
            where: { id: user.id }, 
            data: { equippedCosmetic: cosmeticId } 
        })
        
        res.json({ success: true })
    } catch (error) { 
        next(error) 
    }
})

/**
 * GET /api/v1/user/cosmetics
 * 
 * Returns user's cosmetic collection.
 * 
 * Response:
 * - unlockedCosmetics: Array of cosmetic IDs user owns
 * - equippedCosmetic: Currently equipped cosmetic ID
 */
router.get('/api/v1/user/cosmetics', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        res.json({
            unlockedCosmetics: user.unlockedCosmetics ?? ['gold'],
            equippedCosmetic: user.equippedCosmetic ?? 'gold',
        })
    } catch (error) { 
        next(error) 
    }
})

export default router