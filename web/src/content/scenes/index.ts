/**
 * Scene registry — blueprint-driven (Phase S1).
 * Keys trimmed on insert AND on lookup: seed data carries stray whitespace
 * ("PA1.SND.LST.02 "), and the console hides it — the registry must not care.
 *
 * Phase A: Exports `applyLearnerName` for runtime name injection in the page.
 */
import type { SceneSpec } from '@/lib/sceneTypes'
import { UNIT1 } from '@/lib/blueprint'
import { compileScene } from './compileScene'

const BLUEPRINTS = new Map(UNIT1.map(bp => [bp.competency.trim(), bp]))

// Dev-time self-check: Unit 1 must be complete at boot.
if (process.env.NODE_ENV !== 'production') {
    const expected = ['PA1.SND.LST.01', 'PA1.SND.LST.02', 'PA1.SOC.GRT.01', 'PA1.SOC.GRT.02', 'PA1.SOC.COU.01']
    const missing = expected.filter(c => !BLUEPRINTS.has(c))
    if (missing.length) console.warn('[ecla] Unit 1 blueprints missing for:', missing)
    else console.info('[ecla] Scene registry ready:', [...BLUEPRINTS.keys()].join(', '))
}

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
    return compileScene(bp, lesson)
}

// Runtime personalization (Phase A: Learner Memory)
export { applyLearnerName } from './personalize'
export { streetEncounter } from './streetEncounter'