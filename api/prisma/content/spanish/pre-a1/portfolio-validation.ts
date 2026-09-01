import type { PreA1PortfolioEntry } from './portfolio-types'

export type PortfolioReport = { passed: boolean; publishable: boolean; errors: string[]; reviewBlockers: string[] }

export function validatePreA1Portfolio(entries: PreA1PortfolioEntry[], expectedCodes: ReadonlySet<string>): PortfolioReport {
    const errors: string[] = []
    const reviewBlockers: string[] = []
    const seenCodes = new Set<string>()
    const seenContexts = new Set<string>()
    for (const item of entries) {
        const tag = item.code
        if (seenCodes.has(tag)) errors.push(`${tag}: duplicate portfolio entry`)
        seenCodes.add(tag)
        if (!expectedCodes.has(tag)) errors.push(`${tag}: not in the canonical Pre-A1 curriculum`)
        if (!item.realization.core.length || !item.realization.acceptedMeaningVariants.length) errors.push(`${tag}: incomplete canonical realization`)
        if (item.contexts.length < 3) errors.push(`${tag}: requires at least three contexts`)
        for (const context of item.contexts) {
            const key = `${tag}:${context.slug}`
            if (seenContexts.has(key)) errors.push(`${key}: duplicate context`)
            seenContexts.add(key)
            if (!context.setting.trim() || !context.partner.trim() || !context.opening.trim() || !context.learnerGoal.trim() || !context.variation.trim()) errors.push(`${key}: incomplete authored context`)
        }
        if (item.listening.length < 2 || new Set(item.listening.map(line => `${line.speaker}:${line.locale}`)).size < 2 || new Set(item.listening.map(line => line.rate)).size < 2) errors.push(`${tag}: listening requires at least two speakers/locales and rates`)
        if (!item.production.spoken.trim() || !item.production.written.trim() || !item.interaction.trim()) errors.push(`${tag}: spoken, written, and interaction work are required`)
        if (!item.repair.trigger.trim() || !item.repair.strategy.trim()) errors.push(`${tag}: repair opportunity is required`)
        if (!item.contexts.some(context => context.slug === item.transfer.contextSlug) || !item.transfer.novelty.trim()) errors.push(`${tag}: transfer must identify an authored novel context`)
        if (item.retention.delayHours < 24 || !item.retention.prompt.trim()) errors.push(`${tag}: delayed retention task is required`)
        if (!item.culture.note.trim()) errors.push(`${tag}: cultural note is required`)
        if (item.culture.review.status !== 'approved') reviewBlockers.push(`${tag}: independent cultural review pending`)
        if (item.nativeSpeakerReview.status !== 'approved') reviewBlockers.push(`${tag}: independent native-speaker review pending`)
        for (const [name, review] of [['culture', item.culture.review], ['native-speaker', item.nativeSpeakerReview]] as const) {
            if (review.status === 'approved' && (!review.reviewer?.trim() || !review.reviewedAt || review.note.trim().length < 20)) errors.push(`${tag}: ${name} approval lacks reviewer evidence`)
        }
    }
    for (const code of expectedCodes) if (!seenCodes.has(code)) errors.push(`${code}: missing portfolio entry`)
    return { passed: errors.length === 0, publishable: errors.length === 0 && reviewBlockers.length === 0, errors, reviewBlockers }
}
