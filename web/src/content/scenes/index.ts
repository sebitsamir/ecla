import type { SceneSpec } from '@/lib/sceneTypes'
import { firstContactCafe } from './firstContactCafe'

/** The registry of all authored cinematic scenes. */
export const SCENES: SceneSpec[] = [firstContactCafe]

/** Find the scene mapped to a specific competency code. */
export const sceneFor = (code?: string | null): SceneSpec | undefined =>
    SCENES.find(s => !!code && s.competencyCodes.includes(code))