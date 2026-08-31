import { createHash } from 'node:crypto'
import type { PrismaClient, Prisma } from '@prisma/client'
import { GOLDEN_SCENES } from './curriculum'
import { GOLDEN_CODE } from '../../../packages/contracts/golden'

/** Explicit seed command only. Never mutates databases during server startup. */
export async function seedGolden(db: PrismaClient) {
    const competency = await db.competency.findUnique({ where: { code: GOLDEN_CODE }, include: { experiences: { where: { type: 'STORY' }, orderBy: { orderIndex: 'asc' }, take: 1 } } })
    if (!competency?.experiences[0]) throw new Error('Seed the core curriculum and its STORY experience before golden scenes.')
    return db.$transaction(async tx => {
        const ids: string[] = []
        for (const { slug, definition } of GOLDEN_SCENES) {
            const version = createHash('sha256').update(JSON.stringify(definition)).digest('hex')
            const scene = await tx.scene.upsert({
                where: { slug },
                update: {},
                create: {
                    competencyId: competency.id, slug, archetype: 'golden-greeting', title: definition.title,
                    environment: definition.setting, objective: competency.canDo,
                    isPublished: true, metadata: { contract: definition.contract, reviewStatus: 'educator_review_pending' },
                },
            })
            if (scene.competencyId !== competency.id) throw new Error(`Scene ${slug} belongs to another competency`)
            const row = await tx.assessmentSceneVersion.upsert({
                where: { sceneId_version: { sceneId: scene.id, version } }, update: {},
                create: { sceneId: scene.id, experienceId: competency.experiences[0].id, version, definition: definition as unknown as Prisma.InputJsonValue, published: true, educatorReviewed: false },
            })
            ids.push(row.id)
        }
        return ids
    })
}
