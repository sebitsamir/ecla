import type { PrismaClient } from '@prisma/client'
import { GOLDEN_SCENES } from '../golden/curriculum'
import { publicStep } from '../golden/definition'
import { ScenePlatform } from './platform'
import { SCENE_CONTRACT } from '../../../packages/contracts/scene'

/** Content migration creates drafts; it never invents editorial approval or publishes. */
export async function seedCanonicalScenes(db: PrismaClient) {
    const platform = new ScenePlatform(db)
    const revisions = []
    for (const scene of GOLDEN_SCENES.filter(scene => scene.definition.purpose === 'practice')) {
        const { definition } = scene
        revisions.push(await platform.draft('seed:golden-to-canonical/1', {
            contract: SCENE_CONTRACT, schemaVersion: 1, slug: `${scene.slug}-practice`,
            competencyCode: definition.competencyCode, title: definition.title, setting: definition.setting,
            objective: 'Practice greeting someone and asking for repetition in Spanish.',
            purpose: definition.purpose, contextFingerprint: definition.contextFingerprint,
            experiment: null, steps: definition.steps.map(publicStep),
        }))
    }
    return revisions
}
