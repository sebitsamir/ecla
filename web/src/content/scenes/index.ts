/**
 * Scene registry — blueprint-driven.
 * Add a unit by appending its blueprints; the compiler does the rest.
 */
import type { SceneSpec } from '@/lib/sceneTypes'
import { UNIT1 } from '@/lib/blueprint'
import { compileScene } from './compileScene'

const BLUEPRINTS = new Map([...UNIT1].map(bp => [bp.competency, bp]))

export const sceneFor = (code?: string | null, lesson?: any): SceneSpec | undefined => {
    if (!code || !lesson) return undefined
    const bp = BLUEPRINTS.get(code)
    return bp ? compileScene(bp, lesson) : undefined
}

export { personalizeScene } from './personalize'
export { streetEncounter } from './streetEncounter'