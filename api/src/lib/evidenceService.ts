/**
 * Evidence Service — single path for recording learner evidence and updating mastery.
 */
import { MasteryLevel } from '@prisma/client'
import { prisma } from './prisma'
import { nextReviewDate } from '../routes/adaptive'
import {
    evaluateMasteryLevel,
    experienceEngagementLevel,
    bestScore,
    blendScore,
    overallFromDimensions,
    buildContextKey,
    mergeContexts,
} from './masteryEngine'

export type StructuredEvidence = {
    comprehension?: number | null
    retrieval?: number | null
    production?: number | null
    application?: number | null
    interaction?: number | null
    transfer?: number | null
    repairUsed?: boolean
    supportUsed?: number
}

export type DemonstrationInput = {
    userId: string
    competencyId: string
    correct?: number
    incorrect?: number
    evidence?: StructuredEvidence | null
    sceneId?: string
    environmentId?: string
    characterId?: string
    contextId?: string
    review?: boolean
}

export type ExperienceCompletionInput = {
    userId: string
    competencyId: string
    subLessonId?: string
    correctCount: number
    incorrectCount: number
    review?: boolean
    dimensionField?: string | null
    dimensionScore?: number | null
}

const DIMENSION_BY_TYPE: Record<string, string> = {
    STORY: 'comprehensionScore',
    DRILL: 'retrievalScore',
    IMMERSION: 'interactionScore',
    PROFESSIONAL: 'applicationScore',
    MISSION: 'transferScore',
}

export function dimensionFieldForType(type: string): string | null {
    return DIMENSION_BY_TYPE[type] ?? null
}

export async function recordDemonstrationEvidence(input: DemonstrationInput) {
    const {
        userId,
        competencyId,
        correct = 0,
        incorrect = 0,
        evidence,
        sceneId,
        environmentId,
        characterId,
        contextId,
        review,
    } = input

    const total = Number(correct) + Number(incorrect)
    const ratio = total ? Number(correct) / total : 0
    const score = Math.round(ratio * 100)

    const existing = await prisma.competencyMastery.findUnique({
        where: { userId_competencyId: { userId, competencyId } },
    })

    const ev = (evidence && typeof evidence === 'object') ? evidence : {}
    const hasStructuredEvidence = evidence && typeof evidence === 'object'

    const comp = hasStructuredEvidence ? (ev.comprehension ?? null) : score
    const prod = hasStructuredEvidence ? (ev.production ?? ev.application ?? null) : score
    const retr = hasStructuredEvidence ? (ev.retrieval ?? null) : null
    const inter = hasStructuredEvidence ? (ev.interaction ?? null) : null
    const trans = hasStructuredEvidence ? (ev.transfer ?? null) : null
    const repairUsed = hasStructuredEvidence ? (ev.repairUsed === true) : false

    const newComp = bestScore(existing?.comprehensionScore, comp)
    const newProd = bestScore(existing?.applicationScore, prod)
    const newRetr = bestScore(existing?.retrievalScore, retr)
    const newInter = bestScore(existing?.interactionScore, inter)
    const newTrans = bestScore(existing?.transferScore, trans)

    const contextKey = buildContextKey({ sceneId, environmentId, characterId, contextId })
    const contexts = mergeContexts(existing?.contexts as string[] | undefined, contextKey)
    const repairsCompleted = (existing?.repairsCompleted ?? 0) + (repairUsed ? 1 : 0)

    const now = Date.now()
    const delayed = !!existing?.lastAssessedAt &&
        now - new Date(existing.lastAssessedAt).getTime() >= 24 * 3600 * 1000

    const level = evaluateMasteryLevel({
        currentLevel: existing?.level ?? MasteryLevel.NOT_STARTED,
        comprehension: newComp,
        production: newProd,
        retrieval: newRetr,
        transfer: newTrans,
        contextsCount: contexts.length,
        repairsCompleted,
        delayed,
    })

    const overallScore = overallFromDimensions([newComp, newProd, newRetr, newInter, newTrans])

    const data = {
        level,
        lastAssessedAt: new Date(),
        nextReviewAt: nextReviewDate(level, review === true),
        comprehensionScore: newComp,
        applicationScore: newProd,
        retrievalScore: newRetr,
        interactionScore: newInter,
        transferScore: newTrans,
        contexts,
        repairsCompleted,
        overallScore: overallScore ?? 0,
        successCount: { increment: Number(correct) },
        failureCount: { increment: Number(incorrect) },
        exposureCount: { increment: 1 },
    }

    if (existing) {
        await prisma.competencyMastery.update({ where: { id: existing.id }, data })
    } else {
        await prisma.competencyMastery.create({
            data: {
                userId,
                competencyId,
                level,
                lastAssessedAt: new Date(),
                nextReviewAt: nextReviewDate(level, review === true),
                comprehensionScore: newComp,
                applicationScore: newProd,
                retrievalScore: newRetr,
                interactionScore: newInter,
                transferScore: newTrans,
                contexts,
                repairsCompleted,
                overallScore: overallScore ?? 0,
                successCount: Number(correct),
                failureCount: Number(incorrect),
                exposureCount: 1,
            },
        })
    }

    return { level, contexts: contexts.length, repairs: repairsCompleted }
}

export async function recordExperienceCompletion(input: ExperienceCompletionInput) {
    const {
        userId,
        competencyId,
        correctCount,
        incorrectCount,
        review,
        dimensionField,
        dimensionScore,
    } = input

    const existing = await prisma.competencyMastery.findUnique({
        where: { userId_competencyId: { userId, competencyId } },
    })

    const level = experienceEngagementLevel(
        existing?.level ?? MasteryLevel.NOT_STARTED,
        true,
    )

    const updateData: Record<string, unknown> = {
        successCount: { increment: correctCount },
        failureCount: { increment: incorrectCount },
        exposureCount: { increment: 1 },
        level,
        lastAssessedAt: new Date(),
        nextReviewAt: nextReviewDate(level, review === true),
    }

    if (dimensionField && dimensionScore !== null && dimensionScore !== undefined) {
        updateData[dimensionField] = blendScore((existing as any)?.[dimensionField], dimensionScore)
    }

    const createData: Record<string, unknown> = {
        userId,
        competencyId,
        level,
        exposureCount: 1,
        successCount: correctCount,
        failureCount: incorrectCount,
        lastAssessedAt: new Date(),
        nextReviewAt: nextReviewDate(level, review === true),
    }
    if (dimensionField && dimensionScore !== null && dimensionScore !== undefined) {
        createData[dimensionField] = dimensionScore
    }

    await prisma.competencyMastery.upsert({
        where: { userId_competencyId: { userId, competencyId } },
        update: updateData,
        create: createData as any,
    })

    const mastery = await prisma.competencyMastery.findUnique({
        where: { userId_competencyId: { userId, competencyId } },
    })
    if (mastery) {
        const overall = overallFromDimensions([
            mastery.comprehensionScore,
            mastery.retrievalScore,
            mastery.interactionScore,
            mastery.applicationScore,
            mastery.transferScore,
        ])
        if (overall !== null) {
            await prisma.competencyMastery.update({
                where: { id: mastery.id },
                data: { overallScore: overall },
            })
        }
    }

    return { level }
}

export async function applyMissionEvidence(input: {
    userId: string
    competencyId: string
    passed: boolean
    missionId: string
}) {
    const { userId, competencyId, passed, missionId } = input
    const existing = await prisma.competencyMastery.findUnique({
        where: { userId_competencyId: { userId, competencyId } },
    })

    const transferScore = blendScore(existing?.transferScore, passed ? 85 : 40)
    const interactionScore = blendScore(existing?.interactionScore, passed ? 75 : 45)
    const contexts = mergeContexts(existing?.contexts as string[] | undefined, `mission:${missionId}`)

    const now = Date.now()
    const delayed = !!existing?.lastAssessedAt &&
        now - new Date(existing.lastAssessedAt).getTime() >= 24 * 3600 * 1000

    const level = evaluateMasteryLevel({
        currentLevel: existing?.level ?? MasteryLevel.NOT_STARTED,
        comprehension: existing?.comprehensionScore ?? null,
        production: existing?.applicationScore ?? null,
        retrieval: existing?.retrievalScore ?? null,
        transfer: transferScore,
        contextsCount: contexts.length,
        repairsCompleted: existing?.repairsCompleted ?? 0,
        delayed,
    })

    const overallScore = overallFromDimensions([
        existing?.comprehensionScore,
        existing?.retrievalScore,
        interactionScore,
        existing?.applicationScore,
        transferScore,
    ])

    await prisma.competencyMastery.upsert({
        where: { userId_competencyId: { userId, competencyId } },
        update: {
            transferScore,
            interactionScore,
            transferCount: passed ? { increment: 1 } : undefined,
            contexts,
            level,
            overallScore: overallScore ?? undefined,
            lastAssessedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        },
        create: {
            userId,
            competencyId,
            level,
            transferScore,
            interactionScore,
            transferCount: passed ? 1 : 0,
            contexts,
            overallScore: overallScore ?? 0,
            exposureCount: 1,
            lastAssessedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        },
    })

    return { level }
}

export async function applyGatewayEvidence(input: {
    userId: string
    competencyId: string
    comprehension: number
    production: number
    transfer: number
    interaction: number
    gatewayContextKey: string
}) {
    const { userId, competencyId, comprehension, production, transfer, interaction, gatewayContextKey } = input
    const existing = await prisma.competencyMastery.findUnique({
        where: { userId_competencyId: { userId, competencyId } },
    })

    const newComp = bestScore(existing?.comprehensionScore, comprehension)
    const newProd = bestScore(existing?.applicationScore, production)
    const newTrans = bestScore(existing?.transferScore, transfer)
    const newInter = bestScore(existing?.interactionScore, interaction)
    const contexts = mergeContexts(existing?.contexts as string[] | undefined, gatewayContextKey)

    const now = Date.now()
    const delayed = !!existing?.lastAssessedAt &&
        now - new Date(existing.lastAssessedAt).getTime() >= 24 * 3600 * 1000

    const level = evaluateMasteryLevel({
        currentLevel: existing?.level ?? MasteryLevel.NOT_STARTED,
        comprehension: newComp,
        production: newProd,
        retrieval: existing?.retrievalScore ?? null,
        transfer: newTrans,
        contextsCount: contexts.length,
        repairsCompleted: existing?.repairsCompleted ?? 0,
        delayed,
    })

    const overallScore = overallFromDimensions([newComp, newProd, existing?.retrievalScore, newInter, newTrans])

    await prisma.competencyMastery.upsert({
        where: { userId_competencyId: { userId, competencyId } },
        update: {
            level,
            comprehensionScore: newComp,
            applicationScore: newProd,
            transferScore: newTrans,
            interactionScore: newInter,
            contexts,
            overallScore: overallScore ?? undefined,
            lastAssessedAt: new Date(),
        },
        create: {
            userId,
            competencyId,
            level,
            comprehensionScore: newComp,
            applicationScore: newProd,
            transferScore: newTrans,
            interactionScore: newInter,
            contexts,
            overallScore: overallScore ?? 0,
            lastAssessedAt: new Date(),
        },
    })

    return { level }
}
