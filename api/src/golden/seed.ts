import { createHash } from 'node:crypto'
import type { PrismaClient, Prisma } from '@prisma/client'
import { GOLDEN_SCENES } from './curriculum'
import { benchmarkGoldenScenes } from './benchmarkCurriculum'
import { GOLDEN_CODE } from '../../../packages/contracts/golden'

/** Explicit seed command only. Never mutates databases during server startup. */
export async function seedGolden(db: PrismaClient) {
    return db.$transaction(async tx => {
        const ids: string[] = []
        for (const { slug, definition } of [...GOLDEN_SCENES,...benchmarkGoldenScenes()]) {
            const competency = await tx.competency.findUnique({ where: { code: definition.competencyCode }, include: { experiences: { where: { type: 'STORY' }, orderBy: { orderIndex: 'asc' }, take: 1 } } })
            if (!competency) {
                console.warn(`Skipping benchmark scene ${slug}: competency ${definition.competencyCode} is not installed.`)
                continue
            }
            const experience = competency.experiences[0] ?? await tx.learningExperience.create({ data: {
                id: `${competency.id}-release-story`, competencyId: competency.id, type: 'STORY',
                title: `${competency.title} — Guided scene`, description: competency.canDo,
                orderIndex: 0, content: { source: 'release-bootstrap' }, estimatedMinutes: 8,
            } })
            const version = createHash('sha256').update(JSON.stringify(definition)).digest('hex')
            const scene = await tx.scene.upsert({
                where: { slug },
                update: {},
                create: {
                    competencyId: competency.id, slug, archetype: 'benchmark', title: definition.title,
                    environment: definition.setting, objective: competency.canDo,
                    isPublished: true, metadata: { contract: definition.contract, reviewStatus: 'educator_review_pending' },
                },
            })
            if (scene.competencyId !== competency.id) throw new Error(`Scene ${slug} belongs to another competency`)
            const row = await tx.assessmentSceneVersion.upsert({
                where: { sceneId_version: { sceneId: scene.id, version } }, update: {},
                create: { sceneId: scene.id, experienceId: experience.id, version, definition: definition as unknown as Prisma.InputJsonValue, published: true, educatorReviewed: false },
            })
            ids.push(row.id)
        }
        return ids
    })
}
