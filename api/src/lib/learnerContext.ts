/**
 * learnerContext — Phase 30: curriculum-bound AI teacher context.
 * Chat operates inside competency boundaries, not open-ended tutoring.
 */
import { prisma } from './prisma'
import { computeNextAction } from '../routes/adaptive'

export type LearnerChatContext = {
    displayName: string | null
    level: string
    currentCompetency: { code: string; canDo: string; title: string } | null
    weakDimensions: string[]
    knownPatterns: string[]
    recentErrors: string[]
    missionObjective: string | null
    prohibitedTopics: string[]
}

export async function buildLearnerChatContext(userId: string): Promise<LearnerChatContext> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const { dimensions, next } = await computeNextAction(userId)

    const weakDimensions = dimensions
        .filter((d): d is { key: string; avg: number; band: string } => d.avg != null && d.avg < 60)
        .map(d => d.key)

    let currentCompetency: LearnerChatContext['currentCompetency'] = null
    let knownPatterns: string[] = []
    let missionObjective: string | null = null

    if (next.kind === 'lesson' && next.competencyId) {
        const comp = await prisma.competency.findUnique({
            where: { id: next.competencyId },
            include: {
                realizations: { take: 1 },
                missions: { take: 1, select: { objective: true } },
            },
        })
        if (comp) {
            currentCompetency = { code: comp.code, canDo: comp.canDo, title: comp.title }
            const patterns = comp.realizations[0]?.patterns
            if (Array.isArray(patterns)) knownPatterns = patterns.map(String).slice(0, 8)
            missionObjective = comp.missions[0]?.objective ?? null
        }
    } else if (next.kind === 'review' && next.competencyId) {
        const comp = await prisma.competency.findUnique({
            where: { id: next.competencyId },
            include: { realizations: { take: 1 } },
        })
        if (comp) {
            currentCompetency = { code: comp.code, canDo: comp.canDo, title: comp.title }
            const patterns = comp.realizations[0]?.patterns
            if (Array.isArray(patterns)) knownPatterns = patterns.map(String).slice(0, 8)
        }
    }

    const recentErrors = await prisma.learnerEvent.findMany({
        where: { userId, type: 'error' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { payload: true },
    })
    const errorLabels = recentErrors
        .map(e => (e.payload as { category?: string })?.category)
        .filter((c): c is string => !!c)

    return {
        displayName: user?.displayName ?? null,
        level: user?.currentLevel ?? 'PRE_A1',
        currentCompetency,
        weakDimensions,
        knownPatterns,
        recentErrors: errorLabels,
        missionObjective,
        prohibitedTopics: [
            'grammar lectures unrelated to current competency',
            'proficiency level claims',
            'content beyond Pre-A1 without scaffolding',
            'choosing what to learn (curriculum decides)',
        ],
    }
}

export function formatChatSystemPrompt(ctx: LearnerChatContext, voice: boolean): string {
    const base = voice
        ? `You are a character in the learner's Spanish world — warm, brief, in-scene.`
        : `You are ECLA's in-world conversation partner — not a mascot teacher.`

    const bounds = [
        `Learner level: ${ctx.level}.`,
        ctx.currentCompetency
            ? `Current competency: ${ctx.currentCompetency.code} — "${ctx.currentCompetency.canDo}". Stay inside this can-do.`
            : `No open competency — gentle review only.`,
        ctx.weakDimensions.length
            ? `Weak dimensions to practice: ${ctx.weakDimensions.join(', ')}. Steer conversation toward repair and interaction if weak.`
            : '',
        ctx.knownPatterns.length ? `Known patterns: ${ctx.knownPatterns.join('; ')}.` : '',
        ctx.missionObjective ? `Mission objective: ${ctx.missionObjective}` : '',
        ctx.recentErrors.length ? `Recent error types: ${ctx.recentErrors.join(', ')} — remediate gently.` : '',
        `NEVER: ${ctx.prohibitedTopics.join('; ')}.`,
        voice
            ? 'Reply in 1-2 short Spanish sentences. End with a question. No markdown.'
            : 'Reply mostly in Spanish. Add EN: translation line. Under 80 words.',
    ].filter(Boolean).join('\n')

    return `${base}\n${bounds}`
}
