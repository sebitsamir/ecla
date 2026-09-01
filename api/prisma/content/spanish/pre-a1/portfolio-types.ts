export type EditorialReview = {
    status: 'pending' | 'approved'
    reviewer: string | null
    reviewedAt: string | null
    note: string
}

export type PreA1Context = {
    slug: string
    setting: string
    partner: string
    opening: string
    learnerGoal: string
    variation: string
}

export type PreA1PortfolioEntry = {
    code: string
    realization: { core: string[]; acceptedMeaningVariants: string[] }
    contexts: [PreA1Context, PreA1Context, PreA1Context, ...PreA1Context[]]
    listening: [
        { speaker: string; locale: string; rate: number; line: string },
        { speaker: string; locale: string; rate: number; line: string },
        ...Array<{ speaker: string; locale: string; rate: number; line: string }>,
    ]
    production: { spoken: string; written: string }
    interaction: string
    repair: { trigger: string; strategy: string }
    transfer: { contextSlug: string; novelty: string }
    retention: { delayHours: number; prompt: string }
    culture: { note: string; review: EditorialReview }
    nativeSpeakerReview: EditorialReview
}

export const pendingReview = (note: string): EditorialReview => ({
    status: 'pending', reviewer: null, reviewedAt: null, note,
})
