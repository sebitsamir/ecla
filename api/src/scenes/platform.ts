import type { PrismaClient, Prisma } from '@prisma/client'
import { AppError } from '../lib/errors'
import { canonicalJSON, compileScene, migrateSceneSource } from './compiler'
import { PORTFOLIO_EXPERIMENT_KEY } from '../../prisma/content/spanish/pre-a1/portfolio-version'
import { portfolioPublicationBlockers } from '../portfolio/service'
import type { SceneDocument, SceneDelivery } from '../../../packages/contracts/scene'
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue

export class ScenePlatform {
    constructor(private db: PrismaClient) {}
    async draft(actor: string, input: unknown) {
        const result = compileScene(input)
        return this.db.$transaction(async tx => {
            const competency = await tx.competency.findUnique({ where: { code: result.source.competencyCode } })
            if (!competency) throw new AppError('Unknown competency', 400)
            const scene = await tx.scene.upsert({ where: { slug: result.source.slug }, update: {}, create: {
                slug: result.source.slug, competencyId: competency.id, archetype: 'canonical', title: result.source.title,
                environment: result.source.setting, objective: result.source.objective,
            } })
            if (scene.competencyId !== competency.id) throw new AppError('A scene cannot change competency', 409)
            await tx.$queryRaw`SELECT id FROM "Scene" WHERE id = ${scene.id} FOR UPDATE`
            const existing = await tx.sceneRevision.findUnique({ where: { sceneId_version: { sceneId: scene.id, version: result.version } } })
            if (existing) return existing
            const revision = await tx.sceneRevision.create({ data: { sceneId: scene.id, version: result.version, schemaVersion: 1, compilerVersion: result.compilerVersion, source: json(result.source), compiled: json(result.document), createdBy: actor } })
            await tx.sceneRevisionEvent.create({ data: { revisionId: revision.id, actor, action: 'draft', note: 'Created immutable compiled revision' } })
            return revision
        })
    }
    async migrate(actor: string, input: unknown) { return this.draft(actor, migrateSceneSource(input)) }
    async list(slug: string) {
        return this.db.sceneRevision.findMany({ where: { scene: { slug } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { publication: true, events: { orderBy: { createdAt: 'asc' } } } })
    }
    private async locked<T>(id: string, action: (tx: Prisma.TransactionClient, row: NonNullable<Awaited<ReturnType<PrismaClient['sceneRevision']['findUnique']>>>) => Promise<T>) {
        return this.db.$transaction(async tx => {
            const row = await tx.sceneRevision.findUnique({ where: { id } })
            if (!row) throw new AppError('Scene revision not found', 404)
            await tx.$queryRaw`SELECT id FROM "Scene" WHERE id = ${row.sceneId} FOR UPDATE`
            return action(tx, await tx.sceneRevision.findUniqueOrThrow({ where: { id } }))
        })
    }
    async review(actor: string, id: string, note: string) {
        return this.locked(id, async (tx, row) => {
            const compiled = compileScene(row.source)
            if (compiled.version !== row.version) throw new AppError('Revision integrity check failed', 409)
            if (row.reviewedBy) return row
            const reviewed = await tx.sceneRevision.update({ where: { id }, data: { reviewedBy: actor, reviewNote: note, reviewedAt: new Date() } })
            await tx.sceneRevisionEvent.create({ data: { revisionId: id, actor, action: 'review', note } })
            return reviewed
        })
    }
    async publish(actor: string, id: string, expectedRevisionId: string | null) {
        return this.locked(id, async (tx, row) => {
            const current = await tx.scenePublication.findUnique({ where: { sceneId: row.sceneId } })
            if (!row.reviewedBy) throw new AppError('Review this exact revision before publication', 409)
            const compiled = compileScene(row.source)
            if (compiled.version !== row.version) throw new AppError('Revision integrity check failed', 409)
            if (compiled.source.experiment?.key === PORTFOLIO_EXPERIMENT_KEY) {
                const blockers = await portfolioPublicationBlockers(tx, compiled.source.competencyCode, compiled.source.experiment.variant)
                if (blockers.length) throw new AppError(`Portfolio publication blocked: ${blockers.join('; ')}`, 409)
            }
            if (current?.revisionId === id) return current
            if ((current?.revisionId ?? null) !== expectedRevisionId) throw new AppError('Publication changed; reload before publishing', 409)
            const publication = await tx.scenePublication.upsert({ where: { sceneId: row.sceneId }, create: { sceneId: row.sceneId, revisionId: id, publishedBy: actor }, update: { revisionId: id, publishedBy: actor, publishedAt: new Date() } })
            await tx.sceneRevisionEvent.create({ data: { revisionId: id, actor, action: 'publish', note: `Replaces ${current?.revisionId ?? 'no revision'}` } })
            return publication
        })
    }
    async unpublish(actor: string, id: string) {
        return this.locked(id, async (tx, row) => {
            const current = await tx.scenePublication.findUnique({ where: { sceneId: row.sceneId } })
            if (!current) return { unpublished: true }
            if (current.revisionId !== id) throw new AppError('Publication changed; reload first', 409)
            await tx.scenePublication.delete({ where: { sceneId: row.sceneId } })
            await tx.sceneRevisionEvent.create({ data: { revisionId: id, actor, action: 'unpublish', note: 'Removed from learner delivery' } })
            return { unpublished: true }
        })
    }
    async preview(id: string): Promise<SceneDelivery> {
        const row = await this.db.sceneRevision.findUnique({ where: { id } })
        if (!row) throw new AppError('Scene revision not found', 404)
        const compiled = compileScene(row.source)
        if (compiled.version !== row.version) throw new AppError('Revision integrity check failed', 409)
        if (canonicalJSON(row.compiled) !== canonicalJSON(compiled.document)) throw new AppError('Compiled scene integrity check failed', 409)
        return { revisionId: id, version: row.version, document: row.compiled as unknown as SceneDocument }
    }
    async delivery(slug: string): Promise<SceneDelivery> {
        const published = await this.db.scenePublication.findFirst({ where: { scene: { slug } }, include: { revision: true } })
        if (!published) throw new AppError('No published canonical scene', 404)
        const source = compileScene(published.revision.source).source
        if (source.experiment?.key === PORTFOLIO_EXPERIMENT_KEY) {
            const blockers = await portfolioPublicationBlockers(this.db, source.competencyCode, source.experiment.variant)
            if (blockers.length) throw new AppError(`Portfolio publication blocked: ${blockers.join('; ')}`, 409)
        }
        return this.preview(published.revisionId)
    }
    async catalog(competencyId?: string) {
        const rows = await this.db.scenePublication.findMany({ where: competencyId ? { scene: { competencyId } } : {}, include: { scene: true, revision: true }, orderBy: { scene: { slug: 'asc' } } })
        const visible = []
        for (const row of rows) {
            const source = compileScene(row.revision.source).source
            if (source.experiment?.key === PORTFOLIO_EXPERIMENT_KEY && (await portfolioPublicationBlockers(this.db, source.competencyCode, source.experiment.variant)).length) continue
            visible.push({ slug: row.scene.slug, competencyId: row.scene.competencyId, revisionId: row.revisionId, version: row.revision.version, title: (row.revision.compiled as unknown as SceneDocument).title })
        }
        return visible
    }
    async visit(userId: string, revisionId: string, requestKey: string) {
        return this.locked(revisionId, async (tx, row) => {
            const previous = await tx.sceneVisit.findUnique({ where: { userId_requestKey: { userId, requestKey } } })
            if (previous) {
                if (previous.revisionId !== revisionId) throw new AppError('Visit key belongs to another revision', 409)
                return previous
            }
            const publication = await tx.scenePublication.findUnique({ where: { sceneId: row.sceneId } })
            if (publication?.revisionId !== revisionId) throw new AppError('Scene publication changed; reload', 409)
            const { source } = compileScene(row.source)
            if (source.experiment?.key === PORTFOLIO_EXPERIMENT_KEY) {
                const blockers = await portfolioPublicationBlockers(tx, source.competencyCode, source.experiment.variant)
                if (blockers.length) throw new AppError(`Portfolio publication blocked: ${blockers.join('; ')}`, 409)
            }
            return tx.sceneVisit.create({ data: { userId, revisionId, requestKey, experimentKey: source.experiment?.key, variant: source.experiment?.variant } })
        })
    }
}
