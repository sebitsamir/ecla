'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Clock3, RotateCcw, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import { Skeleton } from '@/components/ui'
import { useAuthReady, useProgressTick } from '@/hooks/useAuthReady'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'

type CompetencyRow = {
    competencyId?: string
    competencyCode?: string
    competencyTitle?: string
    canDo?: string
    domain?: string
    level?: string | null
    overallScore?: number | null
    dimensions?: Record<string, number | null> | null
    lastAssessedAt?: string | null
    nextReviewAt?: string | null
}

type CompetenciesResponse = {
    competencies?: CompetencyRow[]
    summary?: {
        mastered?: number
        developing?: number
        notStarted?: number
        weakestDimension?: string | null
        strongestDimension?: string | null
    }
}

const DIMENSIONS = [
    { key: 'comprehension', label: 'Understanding' },
    { key: 'retrieval', label: 'Recall' },
    { key: 'interaction', label: 'Interaction' },
    { key: 'application', label: 'Production' },
    { key: 'transfer', label: 'Transfer' },
] as const

const SUMMARY_DIMENSION_LABELS: Record<string, string> = {
    comprehension: 'Understanding',
    recall: 'Recall',
    production: 'Production',
    interaction: 'Interaction',
    transfer: 'Transfer',
}

const LEVELS = ['EXPOSED', 'DEVELOPING', 'CONTROLLED', 'TRANSFERRED', 'RETAINED'] as const
const LEVEL_LABELS: Record<string, string> = {
    EXPOSED: 'Exposed',
    DEVELOPING: 'Developing',
    CONTROLLED: 'Controlled',
    TRANSFERRED: 'Transferred',
    RETAINED: 'Retained',
}

const levelIndex = (level?: string | null) => Math.max(0, LEVELS.indexOf((level ?? 'EXPOSED') as typeof LEVELS[number]))
const isDemonstrated = (level?: string | null) => level === 'TRANSFERRED' || level === 'RETAINED'
const safeScore = (value?: number | null) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null
const scoreBand = (value?: number | null) => {
    const score = safeScore(value)
    if (score == null) return 'Not measured'
    if (score >= 75) return 'Strong'
    if (score >= 50) return 'Developing'
    return 'Needs practice'
}

function formatDate(value?: string | null) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusPill({ level }: { level?: string | null }) {
    const demonstrated = isDemonstrated(level)
    return (
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${demonstrated ? 'border-success/30 bg-success/10 text-success' : level === 'CONTROLLED' ? 'border-ember/30 bg-ember/10 text-ember-soft' : 'border-line bg-white/[.03] text-stone'}`}>
            {LEVEL_LABELS[level ?? ''] ?? 'Exposed'}
        </span>
    )
}

function MasteryTrack({ level }: { level?: string | null }) {
    const active = levelIndex(level)
    return (
        <div className="mt-4" aria-label={`Mastery state: ${LEVEL_LABELS[level ?? ''] ?? 'Exposed'}`}>
            <div className="flex items-center" aria-hidden>
                {LEVELS.map((state, index) => (
                    <span key={state} className="contents">
                        {index > 0 ? <span className={`h-px min-w-2 flex-1 ${index <= active ? 'bg-success/70' : 'bg-line-strong'}`} /> : null}
                        <span className={`size-2.5 shrink-0 rounded-full border ${index < active ? 'border-success bg-success' : index === active ? 'border-ember-soft bg-ember shadow-[0_0_12px_rgba(255,122,61,.55)]' : 'border-line-strong bg-slate'}`} />
                    </span>
                ))}
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-ash"><span>Exposed</span><span>Retained</span></div>
        </div>
    )
}

function DimensionEvidence({ dimensions }: { dimensions?: Record<string, number | null> | null }) {
    return (
        <ul className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
            {DIMENSIONS.map(({ key, label }) => {
                const value = dimensions?.[key]
                const band = scoreBand(value)
                return (
                    <li key={key} className="min-w-0">
                        <p className="truncate text-[9px] uppercase tracking-[.12em] text-ash">{label}</p>
                        <p className={`mt-1 text-xs font-medium ${band === 'Strong' ? 'text-success' : band === 'Needs practice' ? 'text-warning' : band === 'Not measured' ? 'text-ash' : 'text-ivory'}`}>{band}</p>
                    </li>
                )
            })}
        </ul>
    )
}

function ProgressLoading() {
    return (
        <div role="status" aria-label="Gathering your learning evidence" className="space-y-8 py-3 sm:py-6">
            <div className="space-y-3"><Skeleton className="h-4 w-36" /><Skeleton className="h-14 max-w-2xl sm:h-20" /><Skeleton className="h-5 max-w-xl" /></div>
            <Skeleton className="h-72" />
            <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
        </div>
    )
}

export default function ProgressPage() {
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const tick = useProgressTick()
    const [data, setData] = useState<CompetenciesResponse | null>(null)
    const [summary, setSummary] = useState<LearnerSummary | null>(null)
    const [isLoading, setLoading] = useState(true)
    const [loadError, setError] = useState<ApiError | null>(null)
    const [requestVersion, setRequestVersion] = useState(0)

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return
        let cancelled = false

        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                const [competencies, learnerSummary] = await Promise.all([
                    apiFetch<CompetenciesResponse>('/api/v1/learner/competencies', getToken),
                    fetchSummary(getToken),
                ])
                if (!cancelled) {
                    setData(competencies)
                    setSummary(learnerSummary)
                }
            } catch (reason) {
                if (!cancelled) setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not load your progress.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => { cancelled = true }
    }, [getToken, isLoaded, isSignedIn, requestVersion, tick])

    const error = isLoaded && !isSignedIn
        ? new ApiError('unauthorized', 'Your session needs to be renewed.', 401)
        : loadError
    const rows = Array.isArray(data?.competencies) ? data.competencies : []
    const retained = rows.filter(item => item.level === 'RETAINED')
    const transferred = rows.filter(item => item.level === 'TRANSFERRED')
    const demonstratedRows = rows.filter(item => isDemonstrated(item.level))
    const consolidating = rows.filter(item => item.level === 'CONTROLLED' || item.level === 'DEVELOPING')
    const dueCount = summary?.dueReviews?.length ?? 0
    const total = summary?.total ?? rows.length
    const demonstrated = summary?.demonstrated ?? demonstratedRows.length
    const progress = total > 0 ? Math.min(100, Math.round((demonstrated / total) * 100)) : 0

    return (
        <AppShell>
            {!isLoaded || (isSignedIn && isLoading) ? (
                <ProgressLoading />
            ) : error ? (
                <div className="mx-auto max-w-2xl py-16"><ApiState error={error} onRetry={() => setRequestVersion(value => value + 1)} /><p className="mt-4 text-center text-xs text-ash">Your progress is safe.</p></div>
            ) : rows.length === 0 ? (
                <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center py-12 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-ember-soft"><TrendingUp className="size-6" /></span>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">Your evidence record</p>
                    <h1 className="font-display mt-3 text-4xl text-ivory sm:text-5xl">Your first capability starts here.</h1>
                    <p className="mt-4 max-w-lg text-sm leading-6 text-stone sm:text-base">Complete a learning scene and your first piece of evidence will appear here. Practice alone will never be presented as mastery.</p>
                    <Link href="/course" className="ecla-control mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-ember px-6 text-sm font-semibold text-obsidian hover:bg-ember-soft">Start your first scene <ArrowRight className="size-4" /></Link>
                </section>
            ) : (
                <div className="min-w-0 space-y-12 py-3 sm:space-y-14 sm:py-6">
                    <header className="max-w-3xl">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-ember-soft"><ShieldCheck className="size-4" />Evidence, not streaks</p>
                        <h1 className="font-display mt-3 text-4xl leading-[1.02] text-ivory sm:text-6xl lg:text-7xl">What you can actually do</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone sm:text-base">A record of Spanish capabilities supported by assessed performance, transfer, and retention.</p>
                    </header>

                    <section className="relative overflow-hidden rounded-experience border border-line bg-[radial-gradient(circle_at_75%_20%,rgba(255,122,61,.11),transparent_24rem),linear-gradient(145deg,#17171a,#101012)] p-5 shadow-glow-md sm:p-8 lg:p-10">
                        <div aria-hidden className="ecla-thread absolute inset-x-0 top-0" />
                        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)] lg:items-end">
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[.18em] text-stone">Pre-A1 capability record</p>
                                <div className="mt-5 flex min-w-0 items-end gap-3"><strong className="font-display text-6xl font-normal leading-none text-ivory sm:text-7xl">{demonstrated}</strong><span className="pb-1 text-sm text-stone">of {total}<br />demonstrated</span></div>
                                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[.07]" aria-label={`${progress}% of capabilities demonstrated`}><div className="h-full rounded-full bg-gradient-to-r from-ember to-ember-soft" style={{ width: `${progress}%` }} /></div>
                                <p className="mt-3 text-xs text-ash">Demonstrated means transferred or retained in the learner record.</p>
                            </div>
                            <dl className="grid min-w-0 grid-cols-3 divide-x divide-line border-y border-line py-5 text-center">
                                <div className="min-w-0 px-2"><dt className="text-[9px] uppercase tracking-[.12em] text-ash">Retained</dt><dd className="font-display mt-2 text-3xl text-success">{retained.length}</dd></div>
                                <div className="min-w-0 px-2"><dt className="text-[9px] uppercase tracking-[.12em] text-ash">Transferred</dt><dd className="font-display mt-2 text-3xl text-ivory">{transferred.length}</dd></div>
                                <div className="min-w-0 px-2"><dt className="text-[9px] uppercase tracking-[.12em] text-ash">Consolidating</dt><dd className="font-display mt-2 text-3xl text-ember-soft">{consolidating.length}</dd></div>
                            </dl>
                        </div>
                    </section>

                    <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,.85fr)] lg:gap-12">
                        <section className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[.18em] text-success">Capabilities you can rely on</p>
                            <h2 className="font-display mt-2 text-3xl text-ivory sm:text-4xl">Language that has travelled with you.</h2>
                            {demonstratedRows.length ? (
                                <ol className="mt-6 divide-y divide-line border-y border-line">
                                    {demonstratedRows.map((item, index) => (
                                        <li key={item.competencyId ?? item.competencyCode ?? index} className="min-w-0 py-5 sm:py-6">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success"><Check className="size-4" /></span>
                                                <div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words text-sm font-medium leading-6 text-ivory sm:text-base">{item.canDo ?? item.competencyTitle}</h3><StatusPill level={item.level} /></div><p className="mt-2 text-xs text-ash">{item.competencyTitle}{item.domain ? ` · ${item.domain}` : ''}</p><MasteryTrack level={item.level} /></div>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : <p className="mt-6 border-y border-line py-6 text-sm leading-6 text-stone">No capability has reached transfer yet. Controlled performance remains visible below while it consolidates.</p>}
                        </section>

                        <aside className="min-w-0 space-y-8">
                            <section className="border-t border-line pt-6 lg:border-t-0 lg:pt-0">
                                <p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">Evidence profile</p>
                                <h2 className="font-display mt-2 text-2xl text-ivory">How your Spanish is forming</h2>
                                <ul className="mt-5 divide-y divide-line border-y border-line">
                                    {(summary?.dimensions ?? []).map(dimension => (
                                        <li key={dimension.key} className="flex min-w-0 items-center justify-between gap-4 py-3.5"><span className="min-w-0 break-words text-sm text-stone">{SUMMARY_DIMENSION_LABELS[dimension.key] ?? dimension.key}</span><span className={`shrink-0 text-xs font-semibold ${dimension.band === 'Strong' ? 'text-success' : dimension.band === 'Needs practice' ? 'text-warning' : dimension.band ? 'text-ivory' : 'text-ash'}`}>{dimension.band ?? 'Not measured'}</span></li>
                                    ))}
                                </ul>
                            </section>

                            <section className="rounded-surface border border-line bg-surface p-5 sm:p-6">
                                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-stone"><Sparkles className="size-4 text-ember-soft" />This week</p>
                                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                                    <div><dt className="text-[9px] uppercase tracking-wide text-ash">Capabilities</dt><dd className="font-display mt-1 text-2xl text-ivory">{summary?.week?.demonstrated ?? 0}</dd></div>
                                    <div><dt className="text-[9px] uppercase tracking-wide text-ash">Conversations</dt><dd className="font-display mt-1 text-2xl text-ivory">{summary?.week?.conversations ?? 0}</dd></div>
                                    <div><dt className="text-[9px] uppercase tracking-wide text-ash">Repairs</dt><dd className="font-display mt-1 text-2xl text-ivory">{summary?.week?.repairs ?? 0}</dd></div>
                                </dl>
                            </section>

                            <section className="border-t border-line pt-6">
                                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-warning"><RotateCcw className="size-4" />Ready to strengthen</p>
                                {dueCount ? <><p className="mt-3 text-sm leading-6 text-stone">{dueCount === 1 ? 'One capability is due for review.' : `${dueCount} capabilities are due for review.`}</p><Link href="/review" className="ecla-control mt-4 inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong px-4 text-sm font-medium text-ivory hover:border-ember/40 hover:bg-ember/10">Review now <ArrowRight className="size-4" /></Link></> : <p className="mt-3 text-sm leading-6 text-stone">Nothing is due right now. Ecla will bring a capability back when the timing is useful.</p>}
                            </section>
                        </aside>
                    </div>

                    <section className="min-w-0 border-t border-line pt-8">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-stone"><Clock3 className="size-4" />Evidence record</p>
                        <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><h2 className="font-display text-3xl text-ivory sm:text-4xl">Every assessed capability</h2><p className="text-xs text-ash">{rows.length} recorded</p></div>
                        <ol className="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
                            {rows.map((item, index) => {
                                const assessed = formatDate(item.lastAssessedAt)
                                const review = formatDate(item.nextReviewAt)
                                return (
                                    <li key={item.competencyId ?? item.competencyCode ?? index} className="min-w-0 rounded-surface border border-line bg-carbon/70 p-5 sm:p-6">
                                        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="break-all text-[10px] uppercase tracking-[.12em] text-ash">{item.competencyCode}</p><h3 className="mt-2 break-words text-sm font-medium leading-6 text-ivory sm:text-base">{item.canDo ?? item.competencyTitle}</h3></div><StatusPill level={item.level} /></div>
                                        <MasteryTrack level={item.level} />
                                        <DimensionEvidence dimensions={item.dimensions} />
                                        {(assessed || review) ? <p className="mt-4 border-t border-line pt-3 text-[10px] leading-5 text-ash">{assessed ? `Assessed ${assessed}` : ''}{assessed && review ? ' · ' : ''}{review ? `Review ${review}` : ''}</p> : null}
                                    </li>
                                )
                            })}
                        </ol>
                    </section>
                </div>
            )}
        </AppShell>
    )
}
