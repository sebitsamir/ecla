import type { PrismaClient, User } from '@prisma/client'

export async function exportLearningData(db: PrismaClient, user: User) {
    const [mastery, experienceProgress, vocabularyProgress, streaks, missions, attempts, events, memories, sceneVisits, assessments, plans, pilotParticipations] = await Promise.all([
        db.competencyMastery.findMany({ where: { userId: user.id } }), db.userExperienceProgress.findMany({ where: { userId: user.id } }),
        db.userVocabProgress.findMany({ where: { userId: user.id } }), db.streakLog.findMany({ where: { userId: user.id } }),
        db.missionAttempt.findMany({ where: { userId: user.id } }), db.learningAttempt.findMany({ where: { userId: user.id }, include: { responses: true } }),
        db.learnerEvent.findMany({ where: { userId: user.id } }), db.characterMemory.findMany({ where: { userId: user.id } }),
        db.sceneVisit.findMany({ where: { userId: user.id } }), db.assessmentSession.findMany({ where: { userId: user.id }, include: { turns: true, results: true, acoustics: true, audits: true } }),
        db.learnerPlanSnapshot.findMany({ where: { userId: user.id } }),
        db.pilotParticipant.findMany({ where: { userId: user.id }, include: { study: true, predictions: true, measurements: true, interviews: true } }),
    ])
    return { contract: 'ecla.privacy-export/1', exportedAt: new Date().toISOString(), account: user, mastery, experienceProgress, vocabularyProgress, streaks, missions, attempts, events, memories, sceneVisits, assessments, plans, pilotParticipations }
}

export async function deleteLearningData(db: PrismaClient, user: User) {
    await db.$transaction(async tx => {
        await tx.pilotParticipant.deleteMany({ where: { userId: user.id } })
        await tx.characterMemory.deleteMany({ where: { userId: user.id } }); await tx.learnerEvent.deleteMany({ where: { userId: user.id } })
        await tx.assessmentSession.deleteMany({ where: { userId: user.id } }); await tx.learningAttempt.deleteMany({ where: { userId: user.id } })
        await tx.sceneVisit.deleteMany({ where: { userId: user.id } }); await tx.missionAttempt.deleteMany({ where: { userId: user.id } })
        await tx.learnerPlanSnapshot.deleteMany({ where: { userId: user.id } }); await tx.userExperienceProgress.deleteMany({ where: { userId: user.id } })
        await tx.competencyMastery.deleteMany({ where: { userId: user.id } }); await tx.userVocabProgress.deleteMany({ where: { userId: user.id } })
        await tx.streakLog.deleteMany({ where: { userId: user.id } })
        await tx.user.update({ where: { id: user.id }, data: { motivation: null, preferredMode: 'DRILL', dailyGoalXp: 50, xpTotal: 0, unlockedCosmetics: ['gold'], equippedCosmetic: 'gold', streakDays: 0, lastActiveAt: null, displayName: null, onboardingCompleted: false, currentLevel: null } })
    })
}
