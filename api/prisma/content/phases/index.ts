/**
 * Phase registry — Phase 46: incremental Pre-A1 content authoring.
 */
import type { PhaseContent } from '../types'
import { phase01 } from './preA1.phase01'
import { phase02 } from './preA1.phase02'
import { phase03 } from './preA1.phase03'
import { phase04 } from './preA1.phase04'
import { phase05 } from './preA1.phase05'
import { phase06, phase07, phase08, phase09 } from './preA1.phase06-09'

export const phases: PhaseContent[] = [
    phase01, phase02, phase03, phase04, phase05,
    phase06, phase07, phase08, phase09,
]
