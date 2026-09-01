import { createHash } from 'node:crypto'
import type { PreA1PortfolioEntry } from './portfolio-types'

export const PORTFOLIO_EXPERIMENT_KEY = 'pre-a1-portfolio'
export function portfolioContentVersion(item: PreA1PortfolioEntry) {
    const publishableContent = { ...item, culture: { note: item.culture.note } }
    delete (publishableContent as Partial<PreA1PortfolioEntry>).nativeSpeakerReview
    return createHash('sha256').update(JSON.stringify(publishableContent)).digest('hex')
}

export function portfolioReviewBlockers(item: PreA1PortfolioEntry, version: string) {
    const blockers: string[] = []
    if (portfolioContentVersion(item) !== version) blockers.push('The editorial review targets another portfolio version')
    if (item.culture.review.status !== 'approved') blockers.push('Independent cultural review is pending')
    if (item.nativeSpeakerReview.status !== 'approved') blockers.push('Independent native-speaker review is pending')
    if (item.culture.review.reviewer && item.culture.review.reviewer === item.nativeSpeakerReview.reviewer) blockers.push('Cultural and native-speaker reviews require independent reviewers')
    return blockers
}
