/** Public assessment contract. Answer keys and evaluator configuration stay on the API. */
export const GOLDEN_CODE = 'PA1.SOC.GRT.01'
export const GOLDEN_CONTRACT = 'golden-greeting/1' as const
export type GoldenDimension = 'comprehension' | 'retrieval' | 'production' | 'interaction' | 'transfer' | 'retention'
export type GoldenLevel = 'NOT_STARTED' | 'EXPOSED' | 'DEVELOPING' | 'CONTROLLED' | 'TRANSFERRED' | 'RETAINED'
export type GoldenStep = {
    id: string
    stage: string
    kind: 'encounter' | 'choice' | 'response'
    prompt: string
    speaker?: string
    line?: string
    translation?: string
    options?: { id: string; label: string }[]
    audio: { status: 'tts_fallback'; locale: string; rate: number }
}
export type GoldenResult = {
    contract: typeof GOLDEN_CONTRACT
    attemptId: string
    passed: boolean
    xpAwarded: number
    correct: number
    total: number
    provisionalLevel: GoldenLevel
    masteryLevel: GoldenLevel
    promotionEligible: boolean
    dimensions: Record<GoldenDimension, number | null>
    nextReviewAt: string | null
    explanation: string
}
export type GoldenAttempt = {
    contract: typeof GOLDEN_CONTRACT
    id: string
    status: 'active' | 'completed' | 'expired'
    scene: { title: string; setting: string; version: string; purpose: 'practice' | 'transfer' | 'retention' }
    sequence: number
    totalSteps: number
    step: GoldenStep | null
    support: string | null
    expiresAt: string
    result: GoldenResult | null
}
export type GoldenCatalog = {
    contract: typeof GOLDEN_CONTRACT
    competencyCode: typeof GOLDEN_CODE
    reviewStatus: 'educator_review_pending' | 'reviewed'
    activeAttemptId: string | null
    scenes: { id: string; title: string; setting: string; purpose: 'practice' | 'transfer' | 'retention'; available: boolean; reason: string | null; completed: boolean }[]
}
