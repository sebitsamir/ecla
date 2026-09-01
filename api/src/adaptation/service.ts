import { createHash } from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import { ADAPTATION_CONTRACT, type AdaptationError, type AdaptationPlan, type PlanAction, type SupportBand } from '../../../packages/contracts/adaptation'
import { canonicalJSON } from '../scenes/compiler'

const PLAN_VERSION = 'adaptation-planner/1'
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
const MODE: Record<string, PlanAction['mode']> = { comprehension: 'STORY', retrieval: 'DRILL', production: 'PROFESSIONAL', interaction: 'IMMERSION', transfer: 'MISSION', retention: 'STORY' }
const ERROR: Record<string, AdaptationError> = { comprehension: 'comprehension_gap', retrieval: 'retrieval_gap', production: 'production_gap', interaction: 'interaction_breakdown', transfer: 'transfer_fragility', retention: 'retention_decay' }
const STRATEGY: Record<AdaptationError, string> = {
    comprehension_gap: 'Return to meaning in a short listening context before asking for recall.', retrieval_gap: 'Use spaced, unprompted retrieval with fewer choices.',
    production_gap: 'Rebuild the response from a model, then remove the model on the next turn.', interaction_breakdown: 'Practice one contingent reply and continue after an unexpected partner turn.',
    repair_gap: 'Rehearse a repetition or slower-speech request, then use it inside an interaction.', transfer_fragility: 'Move the same communicative goal into a new partner and setting.',
    retention_decay: 'Schedule a delayed, independent retrieval rather than immediate repetition.',
}
type Stat = { weightedCorrect: number; weight: number; independentCorrect: number; independentTotal: number; failures: Partial<Record<AdaptationError, number>>; contexts: Set<string>; lastAt: Date | null }

export class AdaptationService {
    constructor(private db: PrismaClient, private clock: () => Date = () => new Date()) {}
    async plan(userId: string): Promise<AdaptationPlan> {
        const now = this.clock()
        const [attempts, masteries, confidenceEvents, courses] = await Promise.all([
            this.db.learningAttempt.findMany({ where: { userId, status: 'completed' }, include: { responses: { orderBy: { sequence: 'asc' } }, competency: true }, orderBy: [{ completedAt: 'asc' }, { id: 'asc' }] }),
            this.db.competencyMastery.findMany({ where: { userId }, include: { competency: { include: { prerequisitesAsCompetency: true } } } }),
            this.db.learnerEvent.findMany({ where: { userId, type: 'confidence' }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
            this.db.course.findMany({ where: { isPublished: true, cefrLevel: { in: ['PRE_A1', 'Pre-A1'] }, language: { code: 'es' } }, include: { units: { orderBy: { orderIndex: 'asc' }, include: { competencies: { orderBy: { orderIndex: 'asc' }, include: { prerequisitesAsCompetency: true } } } } } }),
        ])
        const clockBucket = Math.floor(now.getTime() / (15 * 60 * 1000))
        const evidenceVersion = createHash('sha256').update(canonicalJSON({ attempts: attempts.map(row => [row.id, row.completedAt, row.responses.length]), masteries: masteries.map(row => [row.id, row.level, row.lastAssessedAt, row.nextReviewAt, row.performanceJson]), confidence: confidenceEvents.map(row => [row.id, row.createdAt, row.payload]), planner: PLAN_VERSION, clockBucket })).digest('hex')
        const existing = await this.db.learnerPlanSnapshot.findUnique({ where: { userId_evidenceVersion: { userId, evidenceVersion } } })
        if (existing && existing.expiresAt > now) return existing.plan as unknown as AdaptationPlan

        const stats = new Map<string, Stat>()
        const stat = (id: string) => { let value = stats.get(id); if (!value) { value = { weightedCorrect: 0, weight: 0, independentCorrect: 0, independentTotal: 0, failures: {}, contexts: new Set(), lastAt: null }; stats.set(id, value) } return value }
        for (const attempt of attempts) {
            const s = stat(attempt.competencyId); const completedAt = attempt.completedAt ?? attempt.startedAt
            s.lastAt = !s.lastAt || completedAt > s.lastAt ? completedAt : s.lastAt
            const snapshot = attempt.snapshot as { reviewed?: boolean; definition?: { contextFingerprint?: string; purpose?: string } }
            if (snapshot.definition?.contextFingerprint) s.contexts.add(snapshot.definition.contextFingerprint)
            for (const response of attempt.responses.filter(row => row.dimension)) {
                const ageDays = Math.max(0, (now.getTime() - response.observedAt.getTime()) / 86400000)
                const weight = Math.pow(.5, ageDays / 30) * (response.supported ? .45 : 1) * (snapshot.reviewed ? 1 : .35)
                s.weight += weight; if (response.correct) s.weightedCorrect += weight
                if (!response.supported) { s.independentTotal++; if (response.correct) s.independentCorrect++ }
                if (!response.correct) { const error = ERROR[response.dimension ?? ''] ?? 'production_gap'; s.failures[error] = (s.failures[error] ?? 0) + 1 }
            }
            if (attempt.responses.some(row => !row.correct) && !attempt.responses.some(row => row.repair)) s.failures.repair_gap = (s.failures.repair_gap ?? 0) + 1
            if (snapshot.definition?.purpose === 'retention' && attempt.responses.some(row => !row.correct)) s.failures.retention_decay = (s.failures.retention_decay ?? 0) + 1
        }
        const reliable = masteries.filter(row => (row.performanceJson as { educatorReviewed?: boolean } | null)?.educatorReviewed === true)
        const controlled = reliable.filter(row => ['CONTROLLED','TRANSFERRED','RETAINED'].includes(row.level)).length
        const observedAccuracy = [...stats.values()].reduce((sum, row) => sum + row.weightedCorrect, 0) / Math.max(.001, [...stats.values()].reduce((sum, row) => sum + row.weight, 0))
        const placement = controlled >= 10 && observedAccuracy >= .7
            ? { band: 'functional' as const, confidence: Math.min(.95, .55 + controlled / 88), explanation: `${controlled} competencies have reviewed functional evidence; placement remains inside Pre-A1 until Gateway evidence exists.` }
            : reliable.length || attempts.length >= 2
                ? { band: 'developing' as const, confidence: Math.min(.85, .35 + (reliable.length + attempts.length) / 30), explanation: 'Server-owned attempts show emerging ability, but the evidence is not broad enough for functional placement.' }
                : attempts.length ? { band: 'foundation' as const, confidence: .35, explanation: 'Early server-owned evidence supports a foundation starting point with high support.' }
                    : { band: 'unplaced' as const, confidence: 0, explanation: 'No server-owned performance evidence exists yet; begin with the first open competency.' }

        const latestSelf = new Map<string, number>()
        for (const event of confidenceEvents) { const level = (event.payload as { level?: unknown }).level; if (event.competencyId && typeof level === 'number' && level >= 1 && level <= 4) latestSelf.set(event.competencyId, level * 25) }
        const comparisons = [...latestSelf].flatMap(([id, self]) => { const s = stats.get(id); return s?.weight ? [self - s.weightedCorrect / s.weight * 100] : [] })
        const gap = comparisons.length ? Math.round(comparisons.reduce((a,b) => a+b,0) / comparisons.length) : null
        const confidenceCalibration = gap === null ? { state: 'unmeasured' as const, gap, explanation: 'Add a confidence check after a completed attempt to compare feeling with observed performance.' }
            : gap > 20 ? { state: 'overconfident' as const, gap, explanation: 'Self-confidence is running ahead of recent weighted evidence; use an independent check before reducing support.' }
                : gap < -20 ? { state: 'underconfident' as const, gap, explanation: 'Recent performance is stronger than self-confidence; use a short independent success to confirm it.' }
                    : { state: 'aligned' as const, gap, explanation: 'Self-confidence is reasonably aligned with recent weighted performance.' }

        const errorTotals = new Map<AdaptationError, number>()
        for (const s of stats.values()) for (const [error, count] of Object.entries(s.failures) as [AdaptationError, number][]) errorTotals.set(error, (errorTotals.get(error) ?? 0) + count)
        const repairPlan = [...errorTotals].sort((a,b) => b[1]-a[1]).slice(0,3).map(([error,count]) => ({ error, count, strategy: STRATEGY[error] }))
        const mastery = new Map(masteries.map(row => [row.competencyId, row]))
        const recent = attempts.slice(-2).map(row => row.competencyId)
        const competencies = [...new Map(courses.flatMap(course => course.units.flatMap(unit => unit.competencies)).map(row => [row.id, row])).values()]
        const progressed = new Set(reliable.filter(row => ['DEVELOPING','CONTROLLED','TRANSFERRED','RETAINED'].includes(row.level)).map(row => row.competencyId))
        for (const [competencyId, s] of stats) if (s.independentTotal >= 2 && s.independentCorrect / s.independentTotal >= .7) progressed.add(competencyId)
        const candidates: Array<{ score: number; action: Omit<PlanAction,'rank'> }> = []
        for (const comp of competencies) {
            const m = mastery.get(comp.id); const s = stats.get(comp.id); const open = comp.prerequisitesAsCompetency.every(edge => progressed.has(edge.prerequisiteId))
            if (!open && comp.prerequisitesAsCompetency.length) continue
            const accuracy = s?.weight ? s.weightedCorrect / s.weight : null
            const independent = s?.independentTotal ? s.independentCorrect / s.independentTotal : 0
            const support: SupportBand = independent >= .85 && (s?.independentTotal ?? 0) >= 3 ? 'minimal' : independent >= .7 ? 'low' : accuracy !== null && accuracy >= .55 ? 'medium' : attempts.length ? 'high' : 'maximum'
            const topError = s ? (Object.entries(s.failures) as [AdaptationError,number][]).sort((a,b)=>b[1]-a[1])[0] : undefined
            const due = m?.nextReviewAt && m.nextReviewAt <= now
            const needsNovelty = ['CONTROLLED','TRANSFERRED'].includes(m?.level ?? '') && (s?.contexts.size ?? 0) < 3
            const kind: PlanAction['kind'] = due ? 'review' : topError ? 'repair' : needsNovelty ? 'transfer' : 'practice'
            const weakest = topError?.[0] ?? (m?.retrievalScore != null && m.retrievalScore < 65 ? 'retrieval_gap' : 'comprehension_gap')
            const dimension = weakest === 'retrieval_gap' ? 'retrieval' : weakest === 'interaction_breakdown' || weakest === 'repair_gap' ? 'interaction' : weakest === 'transfer_fragility' ? 'transfer' : weakest === 'retention_decay' ? 'retention' : weakest === 'production_gap' ? 'production' : 'comprehension'
            let score = due ? 100 : topError ? 70 + topError[1] * 4 : needsNovelty ? 65 : m ? 35 : 45
            if (recent.includes(comp.id)) score -= 25
            if (accuracy !== null) score += Math.round((1-accuracy)*25)
            const evidence = [accuracy === null ? 'No weighted attempt evidence yet.' : `Recency/reliability-weighted accuracy is ${Math.round(accuracy*100)}%.`, `${s?.contexts.size ?? 0} distinct server-owned context(s) observed.`, topError ? `${topError[1]} recent ${topError[0].replaceAll('_',' ')} signal(s).` : 'No repeated error category detected.']
            candidates.push({ score, action: { kind, competencyId: comp.id, competencyCode: comp.code, title: comp.title, canDo: comp.canDo, mode: needsNovelty ? 'MISSION' : MODE[dimension], href: `/learn/${comp.id}?mode=${needsNovelty ? 'MISSION' : MODE[dimension]}&support=${support}`, support, dueAt: due ? m!.nextReviewAt!.toISOString() : null, reason: due ? 'This competency is due for evidence-weighted retrieval.' : topError ? STRATEGY[topError[0]] : needsNovelty ? 'A new context is needed before this ability can generalize.' : 'This is an open curriculum step with the best current learning value.', evidence } })
        }
        const selected: typeof candidates = []
        for (const candidate of candidates.sort((a,b)=>b.score-a.score)) {
            if (selected.length >= 5) break
            if (selected.some(item => item.action.competencyId === candidate.action.competencyId)) continue
            selected.push(candidate)
        }
        const actions = selected.map((row,index) => ({ rank:index+1,...row.action }))
        if (!actions.length) actions.push({ rank:1, kind:'gateway', title:'Pre-A1 Gateway', canDo:'Demonstrate reviewed abilities across unpredictable situations.', mode:'MISSION', href:'/gateway', support:'minimal', dueAt:null, reason:'No open practice action remains; verify readiness at the Gateway.', evidence:['All curriculum candidates are progressed or locked.'] })
        const generatedAt = now.toISOString(); const expiresAt = new Date(now.getTime()+15*60*1000).toISOString()
        const plan: AdaptationPlan = { contract: ADAPTATION_CONTRACT, version: PLAN_VERSION, evidenceVersion, generatedAt, expiresAt, placement, confidenceCalibration, repairPlan, actions }
        await this.db.learnerPlanSnapshot.upsert({ where: { userId_evidenceVersion: { userId, evidenceVersion } }, create: { userId, version: PLAN_VERSION, evidenceVersion, plan: json(plan), generatedAt: now, expiresAt: new Date(expiresAt) }, update: {} })
        return plan
    }
}
