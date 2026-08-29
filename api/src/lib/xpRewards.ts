/**
 * Server-side XP — rewards are defined by curriculum, not the browser.
 */
import { prisma } from './prisma'

export async function computeExperienceXp(subLessonId?: string, conceptId?: string): Promise<number> {
    if (subLessonId) {
        const exp = await prisma.learningExperience.findUnique({
            where: { id: subLessonId },
            include: { competency: { select: { xpReward: true } } },
        })
        if (exp) {
            const count = await prisma.learningExperience.count({
                where: { competencyId: exp.competencyId },
            })
            return Math.max(5, Math.round(exp.competency.xpReward / Math.max(1, count)))
        }
    }

    if (conceptId) {
        const comp = await prisma.competency.findUnique({
            where: { id: conceptId },
            include: { _count: { select: { experiences: true } } },
        })
        if (comp) {
            return Math.max(5, Math.round(comp.xpReward / Math.max(1, comp._count.experiences)))
        }
    }

    return 5
}
