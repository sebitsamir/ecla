'use client'

/**
 * /progress — the evidence ledger (premium pass).
 * Every demonstrated competency with its dimension scores and review
 * schedule. Dense but quiet: one card per competency, no decoration.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import ProvenRing from '@/components/ecla/dashboard/ProvenRing'
import LanguageProfileRadar from '@/components/ecla/LanguageProfileRadar'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import WeekEvidence from '@/components/ecla/dashboard/WeekEvidence'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type CompetencyRow = {
    competencyCode?: string
    competencyTitle?: string
    canDo?: string
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

const DIMS = [
    { key: 'comprehension', label: 'C' },
    { key: 'retrieval', label: 'R' },
    { key: 'interaction', label: 'I' },
    { key: 'application', label: 'A' },
    { key: 'transfer', label: 'T' },
]

const levelTone = (level?: string | null) =>
    level === 'RETAINED' || level === 'TRANSFERRED'
        ? 'border-leaf/30 bg-leaf/10 text-leaf'
        : level === 'CONTROLLED'
            ? 'border-glow/30 bg-glow/10 text-glow'
            : level === 'DEVELOPING'
                ? 'border-violet-500/30 bg-violet-600/10 text-violet-300'
                : 'border-white/10 bg-white/5 text-cream/50'

const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'

export default function ProgressPage() {
    const { getToken } = useAuth()
    const [data, setData] = useState<CompetenciesResponse | null>(null)
    const [summary, setSummary] = useState<LearnerSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        const fn = () => setTick(t => t + 1)
        window.addEventListener('ecla:progress-updated', fn)
        return () => window.removeEventListener('ecla:progress-updated', fn)
    }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const [comp, sum] = await Promise.all([
                    fetch(`${API_URL}/api/v1/learner/competencies`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                    fetchSummary(getToken),
                ])
                setData(comp)
                setSummary(sum)
            } catch { /* fail soft */ } finally { setLoading(false) }
        })()
    }, [getToken, tick])

    const rows = data?.competencies ?? []
    const snap = data?.summary ?? {}

    return (
        <AppShell>
            {loading ? (
                <div className="space-y-4">
                    <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
                    {[0, 1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    <header>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">Evidence, not streaks</p>
                        <h1 className="font-display mt-1 text-2xl font-bold text-cream sm:text-3xl md:text-4xl">Your progress</h1>
                    </header>

                    {rows.length === 0 ? (
                        <section className="rounded-2xl border border-white/10 bg-[#13131B] p-6 sm:p-8">
                            <TrendingUp className="mb-3 h-5 w-5 text-cream/40" />
                            <p className="text-sm leading-relaxed text-cream/60">
                                No evidence yet. Your first scene starts the record — after that, every win lives here.
                            </p>
                            <Link
                                href="/course"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-glow px-5 py-3 text-sm font-bold text-night-900 transition-all hover:bg-glow/90 active:scale-[0.98]"
                            >
                                Start your first scene <ArrowRight className="h-4 w-4" />
                            </Link>
                        </section>
                    ) : (
                        <>
                            {/* Row 1: ring + snapshot + week */}
                            <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                                <div className="min-w-0">
                                    <ProvenRing demonstrated={summary?.demonstrated ?? 0} total={summary?.total ?? 0} stageLabel="Pre-A1" />
                                </div>
                                <section className="h-full rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
                                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream/50">Snapshot</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { v: snap.mastered ?? 0, l: 'mastered' },
                                            { v: snap.developing ?? 0, l: 'developing' },
                                            { v: snap.notStarted ?? 0, l: 'new' },
                                        ].map(s => (
                                            <div key={s.l} className="rounded-xl border border-white/5 bg-white/[0.03] px-2 py-2.5 text-center">
                                                <p className="font-display text-lg font-bold text-cream">{s.v}</p>
                                                <p className="text-[9px] font-semibold uppercase tracking-widest text-cream/40">{s.l}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {snap.strongestDimension && (
                                            <span className="rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-[10px] font-semibold text-leaf">
                                                strongest · {snap.strongestDimension}
                                            </span>
                                        )}
                                        {snap.weakestDimension && (
                                            <span className="rounded-full border border-glow/30 bg-glow/10 px-3 py-1 text-[10px] font-semibold text-glow">
                                                focus · {snap.weakestDimension}
                                            </span>
                                        )}
                                    </div>
                                </section>
                                <div className="min-w-0 md:col-span-2 xl:col-span-1">
                                    <WeekEvidence week={summary?.week} />
                                </div>
                            </div>

                            {/* Row 2: bands + per-competency evidence */}
                            <div className="grid gap-4 md:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                                <div className="min-w-0 space-y-4">
                                    <LanguageProfileRadar
                                        dimensions={summary?.dimensions ?? []}
                                        focus={snap.weakestDimension}
                                    />
                                    <AbilityProfile dimensions={summary?.dimensions ?? []} />
                                </div>
                                <section className="min-w-0">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Competency evidence</p>
                                    <ul className="space-y-3">
                                        {rows.map((c, i) => (
                                            <li key={c.competencyCode ?? i} className="rounded-2xl border border-white/10 bg-[#13131B] p-4 sm:p-5">
                                                <div className="flex flex-wrap items-start gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold leading-snug text-cream">{c.canDo ?? c.competencyTitle}</p>
                                                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-cream/35">{c.competencyCode}</p>
                                                    </div>
                                                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${levelTone(c.level)}`}>
                                                        {c.level ?? 'new'}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                                                    <div className="min-w-[140px] flex-1">
                                                        <div className="mb-1 flex justify-between text-[10px] text-cream/40">
                                                            <span>overall</span>
                                                            <span>{c.overallScore ?? '—'}</span>
                                                        </div>
                                                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                                                            <div className="h-full rounded-full bg-glow" style={{ width: `${c.overallScore ?? 0}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {DIMS.map(d => {
                                                            const v = c.dimensions?.[d.key]
                                                            return (
                                                                <span
                                                                    key={d.key}
                                                                    title={`${d.key}: ${v ?? '—'}`}
                                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${
                                                                        v == null
                                                                            ? 'bg-white/5 text-cream/30'
                                                                            : v >= 70
                                                                                ? 'bg-leaf/20 text-leaf'
                                                                                : v >= 40
                                                                                    ? 'bg-glow/20 text-glow'
                                                                                    : 'bg-violet-600/20 text-violet-300'
                                                                    }`}
                                                                >
                                                                    {d.label}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                    <p className="text-[10px] text-cream/40">
                                                        assessed {fmtDate(c.lastAssessedAt)} · review {fmtDate(c.nextReviewAt)}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            </div>
                        </>
                    )}
                </div>
            )}
        </AppShell>
    )
}