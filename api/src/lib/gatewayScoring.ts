/**
 * Gateway scoring — Phase 16 multi-dimensional graduation rubric.
 *
 * Transcript heuristics + scenario objectives → 8 qualitative bands.
 * AI is NOT the gate: deterministic rules decide PRE-A1 READY.
 */
import type { GatewayTurn } from '../types/gateway'
import { GATEWAY_CONFIGS, type GatewayScenarioId } from '../types/gateway'

export type DimensionBand = 'Strong' | 'Developing' | 'Needs practice'

export type ScenarioEvidence = {
    scenario: string
    communicated: boolean
    repaired: boolean
    transcript: GatewayTurn[]
}

export type GatewayGraduation = {
    preA1Ready: boolean
    communicated: number
    repaired: number
    total: number
    dimensions: {
        meaning: DimensionBand
        comprehension: DimensionBand
        production: DimensionBand
        interaction: DimensionBand
        repair: DimensionBand
        transfer: DimensionBand
        intelligibility: DimensionBand
        independence: DimensionBand
    }
}

const REPAIR_RE = /(no entiendo|puedes repetir|repite|repita|más despacio|mas despacio|otra vez|qué significa|que significa)/i
const HELP_RE = /(cómo se dice|como se dice|en inglés|in english|traduc)/i

const band = (ratio: number): DimensionBand =>
    ratio >= 0.75 ? 'Strong' : ratio >= 0.45 ? 'Developing' : 'Needs practice'

function learnerTurns(transcript: GatewayTurn[]) {
    return transcript.filter(t => t.role === 'learner' && t.text.trim().length > 0)
}

function scoreScenario(scenarioId: string, transcript: GatewayTurn[]) {
    const learners = learnerTurns(transcript)
    const substantive = learners.filter(t => t.text.trim().length > 4)
    const repaired = learners.some(t => REPAIR_RE.test(t.text))
    const askedHelp = learners.some(t => HELP_RE.test(t.text))
    const aiResponded = transcript.some((t, i) =>
        t.role === 'ai' && i > 0 && transcript[i - 1]?.role === 'learner',
    )
    const config = GATEWAY_CONFIGS[scenarioId as GatewayScenarioId]

    const communicated = substantive.length >= 1 && aiResponded
    const comprehension = learners.length >= 1 && aiResponded
    const production = substantive.length >= 1
    const interaction = learners.length >= 2 && aiResponded
    const independence = production && !askedHelp
    const intelligibility = substantive.length >= Math.min(2, learners.length) || learners.length >= 1

    return {
        scenario: scenarioId,
        communicated,
        repaired,
        transcript,
        signals: { comprehension, production, interaction, independence, intelligibility, objective: !!config },
    }
}

/** Score all gateway scenarios into 8 dimension bands + PRE-A1 READY. */
export function scoreGatewayGraduation(
    items: Array<{ scenario: string; transcript?: GatewayTurn[]; communicated?: boolean; repaired?: boolean }>,
): GatewayGraduation {
    const scored = items.map(item =>
        scoreScenario(item.scenario, item.transcript ?? []),
    )

    const total = scored.length || 1
    const communicated = scored.filter(s => s.communicated).length
    const repaired = scored.filter(s => s.repaired).length

    const avg = (fn: (s: typeof scored[0]) => boolean) =>
        scored.filter(fn).length / total

    const dimensions = {
        meaning: band(communicated / total),
        comprehension: band(avg(s => s.signals.comprehension)),
        production: band(avg(s => s.signals.production)),
        interaction: band(avg(s => s.signals.interaction)),
        repair: repaired >= 1 ? 'Strong' as DimensionBand : communicated >= 3 ? 'Developing' as DimensionBand : 'Needs practice',
        transfer: band(communicated >= 4 ? communicated / total : communicated / Math.max(4, total)),
        intelligibility: band(avg(s => s.signals.intelligibility)),
        independence: band(avg(s => s.signals.independence)),
    }

    const preA1Ready =
        communicated >= 4 &&
        dimensions.meaning !== 'Needs practice' &&
        dimensions.production !== 'Needs practice' &&
        (dimensions.repair === 'Strong' || dimensions.repair === 'Developing')

    return { preA1Ready, communicated, repaired, total, dimensions }
}
