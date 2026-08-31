import { Prisma, type PrismaClient, type LearningAttempt } from '@prisma/client'
import { z } from 'zod'
import { AppError } from '../lib/errors'
import { GOLDEN_CODE, GOLDEN_CONTRACT, type GoldenAttempt, type GoldenCatalog, type GoldenResult } from '../../../packages/contracts/golden'
import { definitionSchema, EVALUATOR_VERSION, DAY_MS, gradeStep, publicStep } from './definition'
import { availability, passedAttempt, projectEvidence, type ObservedAttempt } from './evidence'

const snapshotSchema = z.object({ definition: definitionSchema, reviewed: z.boolean() }).strict()
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
const ATTEMPT_TTL = 2 * 60 * 60 * 1000
type Tx = Prisma.TransactionClient

export class GoldenService {
    constructor(private readonly db: PrismaClient, private readonly clock: () => Date = () => new Date()) {}

    /** PostgreSQL locks serialize *all* attempts for one learner across servers.
     * No provider calls occur inside this transaction. A rollback also rolls
     * back sequence advancement, XP, progress, evidence and review scheduling. */
    private transaction<T>(userId: string, operation: (tx: Tx) => Promise<T>): Promise<T> {
        return this.db.$transaction(async tx => {
            const users = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
            if (!users.length) throw new AppError('Learner not found', 404)
            return operation(tx)
        }, { maxWait: 10000, timeout: 15000 })
    }

    private async history(tx: Tx | PrismaClient, userId: string): Promise<ObservedAttempt[]> {
        const rows = await tx.learningAttempt.findMany({
            where: { userId, competency: { code: GOLDEN_CODE }, status: 'completed' },
            include: { responses: { orderBy: { sequence: 'asc' } } }, orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
        })
        return rows.map(row => {
            const snapshot = snapshotSchema.parse(row.snapshot)
            return { definition: snapshot.definition, reviewed: snapshot.reviewed, completedAt: row.completedAt!, contextNovel: row.contextNovel, retentionEligible: row.retentionEligible, responses: row.responses }
        })
    }

    private async owned(tx: Tx | PrismaClient, userId: string, id: string) {
        const attempt = await tx.learningAttempt.findFirst({ where: { id, userId }, include: { sceneVersion: true } })
        if (!attempt) throw new AppError('Attempt not found', 404)
        return attempt
    }

    private active(attempt: LearningAttempt) {
        if (attempt.status !== 'active' || attempt.expiresAt <= this.clock()) throw new AppError('This attempt is no longer active. Open the greeting journey to start again.', 409)
    }

    private view(attempt: LearningAttempt & { sceneVersion: { version: string } }): GoldenAttempt {
        const { definition } = snapshotSchema.parse(attempt.snapshot)
        const active = attempt.status === 'active' && attempt.expiresAt > this.clock()
        return {
            contract: GOLDEN_CONTRACT, id: attempt.id,
            status: attempt.status === 'completed' ? 'completed' : active ? 'active' : 'expired',
            scene: { title: definition.title, setting: definition.setting, version: attempt.sceneVersion.version, purpose: definition.purpose },
            sequence: attempt.sequence, totalSteps: definition.steps.length,
            step: active && definition.steps[attempt.sequence] ? publicStep(definition.steps[attempt.sequence]) : null,
            support: attempt.supportedSteps.includes(attempt.sequence) ? definition.steps[attempt.sequence]?.model ?? null : null,
            expiresAt: attempt.expiresAt.toISOString(), result: attempt.result as GoldenResult | null,
        }
    }

    async catalog(userId: string): Promise<GoldenCatalog> {
        const [versions, history, active] = await Promise.all([
            this.db.assessmentSceneVersion.findMany({ where: { published: true, scene: { competency: { code: GOLDEN_CODE }, isPublished: true } }, include: { scene: true }, orderBy: { createdAt: 'desc' } }),
            this.history(this.db, userId),
            this.db.learningAttempt.findFirst({ where: { userId, activeKey: GOLDEN_CODE, status: 'active', expiresAt: { gt: this.clock() } }, select: { id: true } }),
        ])
        const current = versions.filter((version, index) => versions.findIndex(other => other.sceneId === version.sceneId) === index)
        return {
            contract: GOLDEN_CONTRACT, competencyCode: GOLDEN_CODE, activeAttemptId: active?.id ?? null,
            reviewStatus: current.length && current.every(version => version.educatorReviewed) ? 'reviewed' : 'educator_review_pending',
            scenes: current.map(version => {
                const definition = definitionSchema.parse(version.definition)
                const reason = availability(definition, history, this.clock())
                return { id: version.id, title: definition.title, setting: definition.setting, purpose: definition.purpose, available: reason === null, reason, completed: history.some(item => item.definition.contextFingerprint === definition.contextFingerprint && passedAttempt(item)) }
            }).sort((a, b) => ['practice', 'transfer', 'retention'].indexOf(a.purpose) - ['practice', 'transfer', 'retention'].indexOf(b.purpose)),
        }
    }

    async get(userId: string, id: string) { return this.view(await this.owned(this.db, userId, id)) }

    async start(userId: string, sceneVersionId: string, idempotencyKey: string) {
        return this.transaction(userId, async tx => {
            const prior = await tx.learningAttempt.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } }, include: { sceneVersion: true } })
            if (prior) {
                if (prior.sceneVersionId !== sceneVersionId) throw new AppError('This request key belongs to a different scene.', 409)
                return this.view(prior)
            }
            const now = this.clock()
            await tx.learningAttempt.updateMany({ where: { userId, activeKey: GOLDEN_CODE, expiresAt: { lte: now } }, data: { status: 'expired', activeKey: null } })
            const active = await tx.learningAttempt.findFirst({ where: { userId, activeKey: GOLDEN_CODE }, include: { sceneVersion: true } })
            if (active) {
                if (active.sceneVersionId !== sceneVersionId) throw new AppError('Finish or resume your active greeting scene first.', 409)
                return this.view(active)
            }
            const count = await tx.learningAttempt.count({ where: { userId, startedAt: { gte: new Date(now.getTime() - 86400000) } } })
            if (count >= 50) throw new AppError('Daily attempt limit reached. Return tomorrow.', 429)
            const version = await tx.assessmentSceneVersion.findFirst({ where: { id: sceneVersionId, published: true, scene: { isPublished: true, competency: { code: GOLDEN_CODE } } }, include: { scene: true, experience: true } })
            if (!version || version.experience.competencyId !== version.scene.competencyId) throw new AppError('Published greeting scene not found', 404)
            const definition = definitionSchema.parse(version.definition)
            const history = await this.history(tx, userId)
            const reason = availability(definition, history, now)
            if (reason) throw new AppError(reason, 409)
            const visited = await tx.learningAttempt.findMany({ where: { userId, competencyId: version.scene.competencyId }, select: { snapshot: true, startedAt: true } })
            if (definition.purpose === 'retention' && visited.some(row => now.getTime() - row.startedAt.getTime() < DAY_MS)) {
                throw new AppError('Wait a full day after your last greeting attempt before a retention check.', 409)
            }
            const contextNovel = !visited.some(row => snapshotSchema.parse(row.snapshot).definition.contextFingerprint === definition.contextFingerprint)
            const attempt = await tx.learningAttempt.create({ data: {
                userId, competencyId: version.scene.competencyId, sceneVersionId, idempotencyKey, activeKey: GOLDEN_CODE,
                startedAt: now, expiresAt: new Date(now.getTime() + ATTEMPT_TTL),
                snapshot: json({ definition, reviewed: version.educatorReviewed }), contextNovel,
                retentionEligible: definition.purpose === 'retention',
            }, include: { sceneVersion: true } })
            return this.view(attempt)
        })
    }

    async support(userId: string, id: string, sequence: number) {
        return this.transaction(userId, async tx => {
            const attempt = await this.owned(tx, userId, id)
            this.active(attempt)
            const { definition } = snapshotSchema.parse(attempt.snapshot)
            if (sequence !== attempt.sequence || !definition.steps[sequence]) throw new AppError('Support is only available for the current task.', 409)
            if (!attempt.supportedSteps.includes(sequence)) {
                attempt.supportedSteps.push(sequence)
                await tx.learningAttempt.update({ where: { id }, data: { supportedSteps: attempt.supportedSteps } })
            }
            return this.view(attempt)
        })
    }

    async respond(userId: string, id: string, input: { sequence: number; responseKey: string; answer: string }) {
        return this.transaction(userId, async tx => {
            const attempt = await this.owned(tx, userId, id)
            const previous = await tx.attemptResponse.findUnique({ where: { attemptId_responseKey: { attemptId: id, responseKey: input.responseKey } } })
            if (previous) {
                if (previous.sequence !== input.sequence || previous.answer !== input.answer) throw new AppError('Response key was already used for a different answer.', 409)
                return { attempt: this.view(attempt), feedback: { correct: previous.correct, supported: previous.supported } }
            }
            this.active(attempt)
            const { definition } = snapshotSchema.parse(attempt.snapshot)
            const step = definition.steps[attempt.sequence]
            if (input.sequence !== attempt.sequence || !step) throw new AppError('This task has already been answered or is out of sequence.', 409)
            if (step.kind === 'encounter' && input.answer !== 'continue') throw new AppError('Acknowledge the encounter to continue.', 400)
            const correct = gradeStep(step, input.answer)
            const supported = attempt.supportedSteps.includes(input.sequence)
            await tx.attemptResponse.create({ data: { attemptId: id, ...input, correct, supported, dimension: step.dimension, repair: step.repair && correct, evaluatorVersion: EVALUATOR_VERSION, observedAt: this.clock() } })
            const updated = await tx.learningAttempt.update({ where: { id }, data: { sequence: { increment: 1 } }, include: { sceneVersion: true } })
            return { attempt: this.view(updated), feedback: { correct, supported } }
        })
    }

    async complete(userId: string, id: string): Promise<GoldenResult> {
        return this.transaction(userId, async tx => {
            const attempt = await this.owned(tx, userId, id)
            if (attempt.status === 'completed') return attempt.result as GoldenResult
            this.active(attempt)
            const snapshot = snapshotSchema.parse(attempt.snapshot)
            const responses = await tx.attemptResponse.findMany({ where: { attemptId: id }, orderBy: { sequence: 'asc' } })
            if (attempt.sequence !== snapshot.definition.steps.length || responses.length !== snapshot.definition.steps.length) throw new AppError('Respond to every task before completing the scene.', 409)
            const previousHistory = await this.history(tx, userId)
            // The learner lock establishes order; preserve it when two completions
            // share a millisecond (or the wall clock moves backwards).
            const now = new Date(Math.max(this.clock().getTime(), (previousHistory.at(-1)?.completedAt.getTime() ?? 0) + 1))
            const current: ObservedAttempt = { definition: snapshot.definition, reviewed: snapshot.reviewed, responses, completedAt: now, contextNovel: attempt.contextNovel, retentionEligible: attempt.retentionEligible }
            const history = [...previousHistory, current]
            const projection = projectEvidence(history)
            const reviewedHistory = history.filter(item => item.reviewed)
            const reviewed = projectEvidence(reviewedHistory)
            const passed = passedAttempt(current)
            const scored = responses.filter(response => response.dimension !== null)
            const progress = await tx.userExperienceProgress.findUnique({ where: { userId_experienceId: { userId, experienceId: attempt.sceneVersion.experienceId } } })
            const xpAwarded = passed && !progress?.xpEarned ? 10 : 0
            const result: GoldenResult = {
                contract: GOLDEN_CONTRACT, attemptId: id, passed, xpAwarded,
                correct: scored.filter(response => response.correct).length, total: scored.length,
                provisionalLevel: projection.level, masteryLevel: reviewedHistory.length ? reviewed.level : 'DEVELOPING',
                promotionEligible: snapshot.reviewed, dimensions: projection.dimensions, nextReviewAt: projection.nextReviewAt,
                explanation: !snapshot.reviewed
                    ? 'This is server-graded, text-mediated pilot evidence. Educator review and recorded audio are pending, so it does not prove spoken fluency or unlock transferred mastery.'
                    : 'This result measures text-mediated greeting tasks. It does not assess pronunciation, acoustic intelligibility or spontaneous spoken fluency.',
            }
            await tx.learningAttempt.update({ where: { id }, data: { status: 'completed', activeKey: null, completedAt: now, result: json(result), xpAwarded } })
            await tx.userExperienceProgress.upsert({
                where: { userId_experienceId: { userId, experienceId: attempt.sceneVersion.experienceId } },
                create: { userId, experienceId: attempt.sceneVersion.experienceId, status: passed ? 'completed' : 'in_progress', attempts: 1, score: result.correct, xpEarned: xpAwarded, completedAt: passed ? now : null, lastAttemptAt: now },
                update: { status: passed || progress?.status === 'completed' ? 'completed' : 'in_progress', attempts: { increment: 1 }, score: result.correct, xpEarned: { increment: xpAwarded }, ...(passed ? { completedAt: now } : {}), lastAttemptAt: now },
            })
            const mastery = {
                level: result.masteryLevel, comprehensionScore: reviewed.dimensions.comprehension, retrievalScore: reviewed.dimensions.retrieval,
                applicationScore: reviewed.dimensions.production, interactionScore: reviewed.dimensions.interaction,
                transferScore: reviewed.dimensions.transfer, retentionScore: reviewed.dimensions.retention,
                contexts: reviewed.contexts, repairsCompleted: reviewed.repairs,
                overallScore: reviewedHistory.length ? Math.round(Object.values(reviewed.dimensions).reduce<number>((sum, value) => sum + (value ?? 0), 0) / Object.values(reviewed.dimensions).filter(value => value !== null).length) : null,
                exposureCount: history.length, successCount: history.flatMap(item => item.responses).filter(item => item.dimension && item.correct).length,
                failureCount: history.flatMap(item => item.responses).filter(item => item.dimension && !item.correct).length,
                lastAssessedAt: now, nextReviewAt: projection.nextReviewAt ? new Date(projection.nextReviewAt) : null,
                performanceJson: json({ source: GOLDEN_CONTRACT, scope: 'text-mediated', educatorReviewed: snapshot.reviewed, attemptId: id }),
            }
            await tx.competencyMastery.upsert({ where: { userId_competencyId: { userId, competencyId: attempt.competencyId } }, create: { userId, competencyId: attempt.competencyId, ...mastery }, update: mastery })
            if (xpAwarded) {
                await tx.user.update({ where: { id: userId }, data: { xpTotal: { increment: xpAwarded }, lastActiveAt: now } })
                const date = now.toISOString().slice(0, 10)
                await tx.streakLog.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, xpEarned: xpAwarded, lessonsDone: 1 }, update: { xpEarned: { increment: xpAwarded }, lessonsDone: { increment: 1 } } })
            }
            return result
        })
    }
}
