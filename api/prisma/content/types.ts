/**
 * ECLA Content Contract — the ONLY shape the content AI may output.
 * Hand-written phase files use the same shape.
 * seedSublessons.ts merges this over its generic generation.
 */

export type PhaseContent = {
    phase: number
    stageName: string
    unitMapping: string                 // e.g. "Stages 0-1 → Unit 1 + Unit 2"
    proposedSeedAdditions?: Array<{   // new competencies → approved as seed.ts diffs
        code: string; title: string; canDo: string; domain: string
        patterns: string[]; examples: string[]
        vocabulary: { word: string; translation: string }[]
        prerequisites: string[]
    }>
    competencies: CompetencyContent[]
}

export type CompetencyContent = {
    code: string                        // MUST exist in seed.ts (or be proposed above)
    story?: { beat: string; dialogue?: { speaker: string; line: string }[] }
    drill?: Array<{
        kind: 'recall' | 'mcq' | 'transformation' | 'shadowing'
        prompt: string; answer: string; accept?: string[]
    }>
    immersion?: { script: { speaker: string; line: string }[]; variationNote?: string }
    professional?: { scenario: string; registerNote?: string }
    mission?: {
        scenario: string
        successCriteria: string[]
        acceptableResponses: string[]
        unexpectedEvent?: string
    }
    listening?: { utterance: string; context: string; action: string }[]
    pronunciation?: { target: string; note: string }[]
    culture?: string
    retention?: { reuseIn: string[] }   // codes where this language must reappear
}