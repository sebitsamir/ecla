/** Shared public assessment session contract. Private rubric patterns stay on the API. */
export const ASSESSMENT_CONTRACT = 'ecla.assessment/1' as const
export type AssessmentKind = 'mission' | 'gateway'
export type AssessmentTurn = { sequence: number; scenarioId: string; role: 'partner' | 'learner'; text: string; source: 'provider' | 'typed' | 'transcript'; observedAt: string }
export type AssessmentResult = {
    scenarioId: string; objectiveAchieved: boolean; meaningCommunicated: boolean
    comprehensionEvidence: number; repairEvidence: boolean; independence: number
    intelligibility: number | null; confidence: number; autoQualifies: boolean
    humanDecision: boolean | null; qualifiesForPromotion: boolean; evaluatorVersion: string
    explanation: string
}
export type AssessmentSession = {
    contract: typeof ASSESSMENT_CONTRACT; id: string; kind: AssessmentKind
    status: 'active' | 'awaiting_review' | 'completed' | 'expired'
    title: string; objective: string; scenarioId: string; scenarioNumber: number; scenarioTotal: number
    openingLine: string | null; turns: AssessmentTurn[]; result: AssessmentResult | null
    expiresAt: string; finalDecision: { passed: boolean; passedScenarios: number; required: number; confidence: number; explanation: string } | null
}
export function isAssessmentSession(value: unknown): value is AssessmentSession {
    if (!value || typeof value !== 'object') return false
    const row = value as Partial<AssessmentSession>
    return row.contract === ASSESSMENT_CONTRACT && typeof row.id === 'string' && ['mission', 'gateway'].includes(row.kind ?? '')
        && ['active', 'awaiting_review', 'completed', 'expired'].includes(row.status ?? '')
        && typeof row.title === 'string' && typeof row.objective === 'string' && typeof row.scenarioId === 'string'
        && Number.isInteger(row.scenarioNumber) && Number.isInteger(row.scenarioTotal) && Array.isArray(row.turns)
        && row.turns.every(turn => Number.isInteger(turn.sequence) && typeof turn.text === 'string' && ['partner', 'learner'].includes(turn.role))
}
