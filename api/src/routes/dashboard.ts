/**
 * Dashboard Route — legacy contract backed by real learner data.
 * Prefer GET /api/v1/learner/home for new clients.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'
import { buildLearnerHome } from '../lib/learnerHome'

const router = Router()

router.get('/api/v1/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const home = await buildLearnerHome(user)

        const today = new Date().toISOString().split('T')[0]
        const todayLog = await prisma.streakLog.findUnique({
            where: { userId_date: { userId: user.id, date: today } },
        })
        const dailyXp = todayLog?.xpEarned || 0

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyLogs = await prisma.streakLog.findMany({
            where: { userId: user.id, date: { gte: weekAgo.toISOString().split('T')[0] } },
        })
        const weeklyXp = weeklyLogs.reduce((sum, log) => sum + log.xpEarned, 0)

        const recent = await prisma.userExperienceProgress.findMany({
            where: { userId: user.id },
            orderBy: { lastAttemptAt: 'desc' },
            take: 5,
        })
        let comboStreak = 0
        for (const p of recent) {
            if (p.score === null || p.score === 0) break
            comboStreak += p.score
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeDays = await prisma.streakLog.count({
            where: { userId: user.id, date: { gte: thirtyDaysAgo.toISOString().split('T')[0] } },
        })

        let glowTier = 'Dim'
        let glowNext = 7
        if (activeDays >= 21) { glowTier = 'Brilliant'; glowNext = 0 }
        else if (activeDays >= 14) { glowTier = 'Radiant'; glowNext = 21 - activeDays }
        else if (activeDays >= 7) { glowTier = 'Warm'; glowNext = 14 - activeDays }
        else { glowTier = 'Dim'; glowNext = 7 - activeDays }

        const masteredCount = home.summary.demonstrated ?? 0
        const lessonsDone = await prisma.userExperienceProgress.count({
            where: { userId: user.id, status: 'completed' },
        })

        const conditions: Record<string, boolean> = {
            gold: true,
            coral: user.streakDays >= 3,
            aurora: masteredCount >= 5,
            moon: lessonsDone >= 10,
            violet: activeDays >= 14,
        }

        const currentUnlocked = user.unlockedCosmetics ?? ['gold']
        const newUnlocks = Object.keys(conditions).filter(id => conditions[id] && !currentUnlocked.includes(id))
        let unlockedCosmetics = currentUnlocked
        if (newUnlocks.length) {
            unlockedCosmetics = [...currentUnlocked, ...newUnlocks]
            await prisma.user.update({ where: { id: user.id }, data: { unlockedCosmetics } })
        }

        const next = home.summary.nextAction
        const nextLesson = next && next.kind === 'lesson' ? {
            conceptId: next.competencyId,
            conceptName: next.title,
            canDo: next.canDo,
            xpReward: 20,
            mode: next.mode,
            variant: {},
        } : null

        const accuracyRows = await prisma.competencyMastery.findMany({
            where: { userId: user.id, comprehensionScore: { not: null } },
            orderBy: { lastAssessedAt: 'desc' },
            take: 5,
            select: { comprehensionScore: true },
        })
        const accuracyScores = accuracyRows
            .map(r => r.comprehensionScore)
            .filter((x): x is number => typeof x === 'number')
        const accuracy = accuracyScores.length
            ? Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length)
            : null

        const reviewRequired = (home.summary.dueReviews?.length ?? 0) > 0

        res.json({
            dailyXp,
            weeklyXp,
            totalXp: user.xpTotal,
            dailyGoalXp: user.dailyGoalXp,
            streakDays: user.streakDays,
            preferredMode: user.preferredMode,
            nextLesson,
            reviewRequired,
            accuracy,
            comboStreak,
            glowTier,
            glowNext,
            activeDays,
            unlockedCosmetics,
            equippedCosmetic: user.equippedCosmetic ?? 'gold',
            newUnlocks,
        })
    } catch (error) { next(error) }
})

export default router
