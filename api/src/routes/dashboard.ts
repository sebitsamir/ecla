/**
 * Dashboard Route — ECLA schema adapter
 * 
 * Same response contract the dashboard page already consumes:
 *   dailyXp, weeklyXp, totalXp, streakDays, preferredMode, nextLesson,
 *   comboStreak, glowTier, glowNext, activeDays, unlockedCosmetics,
 *   equippedCosmetic, newUnlocks, reviewRequired, accuracy
 * 
 * Source mapping (old → new):
 * - userProgress        → UserExperienceProgress (combo streak, lessonsDone)
 * - conceptMastery      → CompetencyMastery (mastered count, next lesson)
 * - concept/variant     → Competency + LearningExperience flavor text
 * - streakLog           → StreakLog (unchanged)
 * 
 * nextLesson rule: first AVAILABLE (prereqs finished) and NOT FINISHED
 * competency — identical to course map, so the two never disagree.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSyncUserFast } from '../lib/auth'

const router = Router()

// §6.4 — levels that count as finished
const FINISHED_LEVELS = ['CONTROLLED', 'TRANSFERRED', 'RETAINED'] as any[]

router.get('/api/v1/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)

        // ── Daily / weekly XP (StreakLog unchanged) ──
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

        // ── Combo streak: consecutive recent experiences with score > 0 ──
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

        // ── Active days + glow tier ──
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

        // ── Cosmetic unlock conditions (new evidence sources) ──
        const masteredCount = await prisma.competencyMastery.count({
            where: { userId: user.id, level: { in: FINISHED_LEVELS } },
        })
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

        // ── Next lesson: first available + unfinished competency ──
        const course = await prisma.course.findFirst({
            where: { isPublished: true },
            include: {
                units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        competencies: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                mastery: { where: { userId: user.id } },
                                experiences: {
                                    orderBy: { orderIndex: 'asc' },
                                    select: { id: true, progress: { where: { userId: user.id }, select: { status: true } } },
                                },
                                prerequisitesAsCompetency: {
                                    select: {
                                        prerequisite: {
                                            select: {
                                                id: true,
                                                mastery: { where: { userId: user.id }, select: { level: true } },
                                                experiences: { select: { id: true, progress: { where: { userId: user.id }, select: { status: true } } } },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        let nextLesson: any = null
        if (course) {
            const finishedOf = (c: any): boolean => {
                const m = c.mastery?.[0]
                if (m && FINISHED_LEVELS.includes(m.level)) return true
                const exps = c.experiences ?? []
                if (exps.length === 0) return false
                return exps.every((e: any) => e.progress?.[0]?.status === 'completed')
            }

            const finishedMap = new Map<string, boolean>()
            for (const u of course.units) for (const c of u.competencies) finishedMap.set(c.id, finishedOf(c))

            let nextConcept: any = null
            outer: for (const u of course.units) {
                for (const c of u.competencies) {
                    const available = (c.prerequisitesAsCompetency ?? []).every((p: any) => finishedMap.get(p.prerequisite.id))
                    if (available && !finishedMap.get(c.id)) { nextConcept = c; break outer }
                }
            }

            if (nextConcept) {
                // Flavor text per mode from the matching experience's first teach block
                const [exps, realization] = await Promise.all([
                    prisma.learningExperience.findMany({
                        where: { competencyId: nextConcept.id },
                        orderBy: { orderIndex: 'asc' },
                    }),
                    prisma.languageRealization.findFirst({ where: { competencyId: nextConcept.id } }),
                ])
                const flavorOf = (type: string) => {
                    const e = exps.find(x => x.type === type)
                    return ((e?.content as any)?.teach?.[0]?.text) ?? null
                }

                nextLesson = {
                    conceptId: nextConcept.id,
                    conceptName: nextConcept.title,
                    canDo: nextConcept.canDo,
                    xpReward: nextConcept.xpReward,
                    mode: user.preferredMode,
                    variant: {
                        storyBeat: flavorOf('STORY'),
                        culturalRef: flavorOf('IMMERSION'),
                        formalPhrase: flavorOf('PROFESSIONAL'),
                    },
                }
            }
        }

        res.json({
            dailyXp,
            weeklyXp,
            totalXp: user.xpTotal,
            dailyGoalXp: user.dailyGoalXp,
            streakDays: user.streakDays,
            preferredMode: user.preferredMode,
            nextLesson,
            reviewRequired: false,
            accuracy: 100,
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