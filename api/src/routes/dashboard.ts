import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUser } from '../lib/auth'
import { cleanVariant } from '../lib/ai'

const router = Router()

router.get('/api/v1/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUser(req)

        const today = new Date().toISOString().split('T')[0]
        const todayLog = await prisma.streakLog.findUnique({
            where: { userId_date: { userId: user.id, date: today } }
        })
        const dailyXp = todayLog?.xpEarned || 0

        // Calculate weekly XP (last 7 days) for future leaderboard support
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyLogs = await prisma.streakLog.findMany({
            where: {
                userId: user.id,
                date: { gte: weekAgo.toISOString().split('T')[0] }
            }
        })
        const weeklyXp = weeklyLogs.reduce((sum, log) => sum + log.xpEarned, 0)

        const recentProgress = await prisma.userProgress.findMany({
            where: { userId: user.id },
            orderBy: { completedAt: 'desc' },
            take: 5,
        })
        let comboStreak = 0
        for (const p of recentProgress) {
            if (p.score === null || p.score === 0) break
            comboStreak += p.score
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeDays = await prisma.streakLog.count({
            where: { userId: user.id, date: { gte: thirtyDaysAgo.toISOString().split('T')[0] } }
        })

        let glowTier = 'Dim'
        let glowNext = 7
        if (activeDays >= 21) { glowTier = 'Brilliant'; glowNext = 0 }
        else if (activeDays >= 14) { glowTier = 'Radiant'; glowNext = 21 - activeDays }
        else if (activeDays >= 7) { glowTier = 'Warm'; glowNext = 14 - activeDays }
        else { glowTier = 'Dim'; glowNext = 7 - activeDays }

        const masteryRows = await prisma.conceptMastery.findMany({ where: { userId: user.id } })
        const masteredCount = masteryRows.filter(m => {
            const total = m.correctCount + m.incorrectCount
            return total >= 2 && m.correctCount / total >= 0.8
        }).length
        const lessonsDone = await prisma.userProgress.count({ where: { userId: user.id } })

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

        const allConcepts = await prisma.concept.findMany({
            where: { unit: { course: { isPublished: true } } },
            orderBy: { orderIndex: 'asc' },
            include: {
                variants: { where: { mode: user.preferredMode } },
                mastery: { where: { userId: user.id } },
                progress: { where: { userId: user.id, status: 'completed' } }
            },
        })

        let nextConcept = allConcepts.find(c => c.progress.length === 0)
        if (!nextConcept) {
            nextConcept = allConcepts.find(c => {
                const m = c.mastery[0]
                const total = (m?.correctCount || 0) + (m?.incorrectCount || 0)
                const acc = total > 0 ? m!.correctCount / total : 1
                return total >= 2 && acc < 0.8
            })
        }
        if (!nextConcept && allConcepts.length > 0) nextConcept = allConcepts[0]

        if (!nextConcept || nextConcept.variants.length === 0) {
            return res.json({
                dailyXp, weeklyXp, totalXp: user.xpTotal,
                dailyGoalXp: user.dailyGoalXp, streakDays: user.streakDays,
                preferredMode: user.preferredMode, nextLesson: null, reviewRequired: false,
                accuracy: 100, comboStreak, glowTier, glowNext, activeDays,
                unlockedCosmetics, equippedCosmetic: user.equippedCosmetic ?? 'gold', newUnlocks,
            })
        }

        const mastery = nextConcept.mastery[0]
        const totalAttempts = (mastery?.correctCount || 0) + (mastery?.incorrectCount || 0)
        const accuracy = totalAttempts > 0 ? (mastery!.correctCount / totalAttempts) : 1

        let reviewRequired = false
        if (totalAttempts >= 2 && accuracy < 0.6) reviewRequired = true

        res.json({
            dailyXp, weeklyXp, totalXp: user.xpTotal,
            dailyGoalXp: user.dailyGoalXp, streakDays: user.streakDays,
            preferredMode: user.preferredMode,
            nextLesson: {
                conceptId: nextConcept.id, conceptName: nextConcept.name,
                xpReward: nextConcept.xpReward, mode: user.preferredMode,
                variant: cleanVariant(nextConcept.variants[0]),
            },
            reviewRequired, accuracy: Math.round(accuracy * 100), comboStreak,
            glowTier, glowNext, activeDays, unlockedCosmetics,
            equippedCosmetic: user.equippedCosmetic ?? 'gold', newUnlocks,
        })
    } catch (error) { next(error) }
})

export default router