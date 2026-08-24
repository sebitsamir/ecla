import type { SceneSpec } from '@/lib/sceneTypes'
import { UNIT1 } from '@/lib/blueprint'
import { compileScene } from './compileScene'

const BLUEPRINTS = new Map(UNIT1.map(bp => [bp.competency.trim(), bp]))

if (process.env.NODE_ENV !== 'production') {
    console.info('[ecla] Scene registry ready:', [...BLUEPRINTS.keys()].join(', '))
}

/** lesson is optional: with it, scenes are fully curriculum-driven;
 *  without it, archetypes fall back to seed-identical defaults. */
export const sceneFor = (code?: string | null, lesson?: any): SceneSpec | undefined => {
    if (!code) return undefined
    const key = String(code).trim()
    const bp = BLUEPRINTS.get(key)
    if (!bp) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[ecla] No scene blueprint for ${JSON.stringify(key)}. Registered:`, [...BLUEPRINTS.keys()])
        }
        return undefined
    }
    return compileScene(bp, lesson ?? {})
}

export { personalizeScene } from './personalize'
export { streetEncounter } from './streetEncounter'