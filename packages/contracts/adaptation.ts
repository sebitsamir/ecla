export const ADAPTATION_CONTRACT = 'ecla.adaptation/1' as const
export type AdaptationError = 'comprehension_gap' | 'retrieval_gap' | 'production_gap' | 'interaction_breakdown' | 'repair_gap' | 'transfer_fragility' | 'retention_decay'
export type SupportBand = 'maximum' | 'high' | 'medium' | 'low' | 'minimal'
export type PlanAction = {
    rank: number; kind: 'review' | 'repair' | 'practice' | 'transfer' | 'retention' | 'gateway'
    competencyId?: string; competencyCode?: string; title: string; canDo: string
    mode: 'STORY' | 'DRILL' | 'PROFESSIONAL' | 'IMMERSION' | 'MISSION'; href: string
    support: SupportBand; dueAt: string | null; reason: string; evidence: string[]
}
export type AdaptationPlan = {
    contract: typeof ADAPTATION_CONTRACT; version: string; evidenceVersion: string; generatedAt: string; expiresAt: string
    placement: { band: 'unplaced' | 'foundation' | 'developing' | 'functional'; confidence: number; explanation: string }
    confidenceCalibration: { state: 'unmeasured' | 'aligned' | 'overconfident' | 'underconfident'; gap: number | null; explanation: string }
    repairPlan: { error: AdaptationError; count: number; strategy: string }[]
    actions: PlanAction[]
}

export function isAdaptationPlan(value: unknown): value is AdaptationPlan {
    const row = value as Partial<AdaptationPlan> | null
    return !!row && row.contract === ADAPTATION_CONTRACT && typeof row.version === 'string' && Array.isArray(row.actions) && !!row.placement
}
