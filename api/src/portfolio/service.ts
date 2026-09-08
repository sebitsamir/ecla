import type { Prisma, PrismaClient } from '@prisma/client'
import { AppError } from '../lib/errors'
import { PRE_A1_PORTFOLIO } from '../../prisma/content/spanish/pre-a1/portfolio'
import { portfolioContentVersion } from '../../prisma/content/spanish/pre-a1/portfolio-version'
import type { PreA1PortfolioEntry } from '../../prisma/content/spanish/pre-a1/portfolio-types'

export type PortfolioReviewKind = 'cultural' | 'native_speaker'
export type PortfolioReviewDecisionValue = 'approved' | 'rejected'
type Db = PrismaClient | Prisma.TransactionClient
type Decision = { id: string; competencyCode: string; contentVersion: string; kind: string; decision: string; reviewerId: string; reviewerQualification: string; note: string; requestKey: string; createdAt: Date }

export function latestReviewDecisions(rows: Decision[]) {
    const result: Partial<Record<PortfolioReviewKind, Decision>> = {}
    for (const row of rows) if ((row.kind === 'cultural' || row.kind === 'native_speaker') && !result[row.kind]) result[row.kind] = row
    return result
}

export function reviewBlockers(item: PreA1PortfolioEntry, rows: Decision[]) {
    const current = latestReviewDecisions(rows)
    const blockers: string[] = []
    if (current.cultural?.decision !== 'approved') blockers.push('Independent cultural review is pending or rejected')
    if (current.native_speaker?.decision !== 'approved') blockers.push('Independent native-speaker review is pending or rejected')
    if (current.cultural?.reviewerId && current.cultural.reviewerId === current.native_speaker?.reviewerId) blockers.push('Cultural and native-speaker approvals require different reviewers')
    return blockers
}

export async function portfolioPublicationBlockers(db: Db, code: string, version: string) {
    const item = PRE_A1_PORTFOLIO.find(entry => entry.code === code)
    if (!item) return ['Portfolio source is not in the canonical Pre-A1 portfolio']
    if (portfolioContentVersion(item) !== version) return ['The editorial review targets another portfolio version']
    const decisions = await db.portfolioReviewDecision.findMany({ where: { competencyCode: code, contentVersion: version }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
    return reviewBlockers(item, decisions)
}

export class PortfolioReviewService {
    constructor(private db: PrismaClient) {}
    private definition(code: string) {
        const item = PRE_A1_PORTFOLIO.find(entry => entry.code === code)
        if (!item) throw new AppError('Pre-A1 portfolio competency not found', 404)
        return item
    }
    private view(item: PreA1PortfolioEntry, decisions: Decision[]) {
        const version = portfolioContentVersion(item)
        const current = latestReviewDecisions(decisions)
        return {
            code: item.code, contentVersion: version, realization: item.realization, contexts: item.contexts,
            listening: item.listening, production: item.production, interaction: item.interaction,
            repair: item.repair, transfer: item.transfer, retention: item.retention, cultureNote: item.culture.note,
            reviews: { cultural: current.cultural ?? null, native_speaker: current.native_speaker ?? null },
            blockers: reviewBlockers(item, decisions), history: decisions,
        }
    }
    private async row(db: Db, item: PreA1PortfolioEntry) {
        const version = portfolioContentVersion(item)
        const decisions = await db.portfolioReviewDecision.findMany({ where: { competencyCode: item.code, contentVersion: version }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
        return this.view(item, decisions)
    }
    async catalog() {
        const codes = PRE_A1_PORTFOLIO.map(entry => entry.code)
        const versions = new Map(PRE_A1_PORTFOLIO.map(entry => [entry.code, portfolioContentVersion(entry)]))
        const decisions = await this.db.portfolioReviewDecision.findMany({
            where: { competencyCode: { in: codes } },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        })
        const byCompetency = new Map<string, Decision[]>()
        for (const decision of decisions) {
            if (decision.contentVersion !== versions.get(decision.competencyCode)) continue
            const rows = byCompetency.get(decision.competencyCode) ?? []
            rows.push(decision)
            byCompetency.set(decision.competencyCode, rows)
        }
        const items = PRE_A1_PORTFOLIO.map(entry => this.view(entry, byCompetency.get(entry.code) ?? []))
        const approved = items.reduce((sum, item) => sum + Number(item.reviews.cultural?.decision === 'approved') + Number(item.reviews.native_speaker?.decision === 'approved'), 0)
        return { totalSlots: items.length * 2, approvedSlots: approved, remainingSlots: items.length * 2 - approved, publishableCompetencies: items.filter(item => item.blockers.length === 0).length, items }
    }
    async decide(actor: string, code: string, input: { kind: PortfolioReviewKind; decision: PortfolioReviewDecisionValue; expectedContentVersion: string; reviewerQualification: string; note: string; requestKey: string }) {
        const item = this.definition(code)
        const version = portfolioContentVersion(item)
        if (input.expectedContentVersion !== version) throw new AppError('Portfolio content changed; reload before reviewing', 409)
        return this.db.$transaction(async tx => {
            const competency = await tx.competency.findUnique({ where: { code } })
            if (!competency) throw new AppError('Curriculum competency not found', 404)
            await tx.$queryRaw`SELECT id FROM "Competency" WHERE id = ${competency.id} FOR UPDATE`
            const replay = await tx.portfolioReviewDecision.findUnique({ where: { reviewerId_requestKey: { reviewerId: actor, requestKey: input.requestKey } } })
            if (replay) {
                if (replay.competencyCode !== code || replay.contentVersion !== version || replay.kind !== input.kind || replay.decision !== input.decision || replay.reviewerQualification !== input.reviewerQualification || replay.note !== input.note) throw new AppError('Review request key belongs to another decision', 409)
                return this.row(tx, item)
            }
            const decisions = await tx.portfolioReviewDecision.findMany({ where: { competencyCode: code, contentVersion: version }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
            const current = latestReviewDecisions(decisions)
            const other = input.kind === 'cultural' ? current.native_speaker : current.cultural
            if (input.decision === 'approved' && other?.decision === 'approved' && other.reviewerId === actor) throw new AppError('A different reviewer must approve the other review category', 409)
            await tx.portfolioReviewDecision.create({ data: { competencyId: competency.id, competencyCode: code, contentVersion: version, kind: input.kind, decision: input.decision, reviewerId: actor, reviewerQualification: input.reviewerQualification, note: input.note, requestKey: input.requestKey } })
            return this.row(tx, item)
        })
    }
}
