/** Public canonical scene document. Never contains evaluation keys or review credentials. */
export const SCENE_CONTRACT = 'ecla.scene/1' as const
export type SceneStep = {
    id: string; stage: string; kind: 'encounter' | 'choice' | 'response'; prompt: string
    speaker?: string; line?: string; translation?: string
    options?: { id: string; label: string }[]
    audio: { status: 'tts_fallback'; locale: string; rate: number }
}
export type SceneDocument = {
    contract: typeof SCENE_CONTRACT; schemaVersion: 1; compilerVersion: string
    slug: string; competencyCode: string; title: string; setting: string; objective: string
    purpose: 'practice' | 'transfer' | 'retention'; contextFingerprint: string
    experiment: { key: string; variant: string } | null
    assessment: 'practice_only'; steps: SceneStep[]
}
export type SceneDelivery = { revisionId: string; version: string; document: SceneDocument }

/** Fail closed on malformed or incompatible delivery instead of falling back to local content. */
export function isSceneDelivery(value: unknown): value is SceneDelivery {
    if (!value || typeof value !== 'object') return false
    const v = value as Record<string, unknown>
    const d = v.document as Partial<SceneDocument> | undefined
    return typeof v.revisionId === 'string' && typeof v.version === 'string' && !!d
        && d.contract === SCENE_CONTRACT && d.schemaVersion === 1 && d.assessment === 'practice_only'
        && ['slug', 'competencyCode', 'title', 'setting', 'objective', 'compilerVersion', 'contextFingerprint'].every(key => typeof (d as Record<string, unknown>)[key] === 'string')
        && ['practice', 'transfer', 'retention'].includes(d.purpose ?? '')
        && Array.isArray(d.steps) && d.steps.length > 0 && d.steps.every(step =>
            !!step && typeof step.id === 'string' && typeof step.prompt === 'string' && typeof step.stage === 'string'
            && ['encounter', 'choice', 'response'].includes(step.kind)
            && (!step.line || typeof step.line === 'string') && (!step.translation || typeof step.translation === 'string')
            && !!step.audio && step.audio.status === 'tts_fallback' && typeof step.audio.locale === 'string'
            && Number.isFinite(step.audio.rate) && step.audio.rate >= 0.5 && step.audio.rate <= 1.2
            && (step.kind !== 'choice' || Array.isArray(step.options) && step.options.length > 0
                && step.options.every(option => !!option && typeof option.id === 'string' && typeof option.label === 'string')))
}
