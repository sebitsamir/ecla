/**
 * Scene registry — curriculum-driven scenes (Phases 6–8).
 *
 * Resolution order:
 *   1. Authored blueprints (Unit 1) — rich creative direction + archetypes
 *   2. Matrix scene — every other Pre-A1 competency with an engine payload
 *   3. undefined → street encounter or course redirect
 */
import type { SceneSpec } from '@/lib/sceneTypes'
import { UNIT1 } from '@/lib/blueprint'
import { compileScene } from './compileScene'
import { matrixSceneFor } from './matrixScene'

const BLUEPRINTS = new Map(UNIT1.map(bp => [bp.competency.trim(), bp]))

/** Dev-time self-check: Unit 1 blueprints must be complete at boot. */
if (process.env.NODE_ENV !== 'production') {
    const expected = ['PA1.SND.LST.01', 'PA1.SND.LST.02', 'PA1.SOC.GRT.01', 'PA1.SOC.GRT.02', 'PA1.SOC.COU.01']
    const missing = expected.filter(c => !BLUEPRINTS.has(c))
    if (missing.length) console.warn('[ecla] Unit 1 blueprints missing for:', missing)
    else console.info('[ecla] Scene registry ready:', [...BLUEPRINTS.keys()].join(', '))
}

export const sceneFor = (code?: string | null, lesson?: any, mode?: string): SceneSpec | undefined => {
    if (!code) return undefined
    const key = String(code).trim()

    const bp = BLUEPRINTS.get(key)
    if (bp) return compileScene(bp, lesson, mode)

    return matrixSceneFor(key, lesson, mode)
}

export { applyLearnerName, personalizeScene } from './personalize'
export { streetEncounter } from './streetEncounter'
export { sceneMatrixEntry } from './matrixScene'
