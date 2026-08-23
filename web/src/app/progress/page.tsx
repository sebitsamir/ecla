'use client'

/**
 * /progress — the evidence world (Phase 11).
 * Ability bands, proven counts, week evidence, and retrievals due —
 * words first, numbers on hover only.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import WeekEvidence from '@/components/ecla/dashboard/WeekEvidence'
import ProvenRing from '@/components/ecla/dashboard/ProvenRing'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'

export default function ProgressPage() {
    const { getToken } = useAuth()
    const [summary, setSummary] = useState<LearnerSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            setSummary(await fetchSummary(getToken))
            setLoading(false)
        })()
    }, [getToken])

    return (
        <AppShell>
            {loading ? (
                <div className="space-y-6">
                    {[0, 1].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
            ) : !summary ? (
                <p className="text-sm text-cream/60">Couldn't load your progress. Refresh to retry.</p>
            ) : (
                <div className="space-y-6">
                    <header>
                        <h1 className="font-display text-2xl font-bold text-cream md:text-3xl">Your development</h1>
                        <p className="mt-1 text-sm text-cream/50">Evidence of what you can do — not points.</p>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <ProvenRing demonstrated={summary.demonstrated} total={summary.total} stageLabel="Pre-A1" />
                        <div className="lg:col-span-2">
                            <AbilityProfile dimensions={summary.dimensions} />
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <WeekEvidence week={summary.week} />
                        <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6">
                            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-cream/50">Retention</p>
                            {summary.dueReviews.length === 0 ? (
                                <p className="text-sm text-cream/60">Nothing is fading yet. Retrievals appear here as life, not homework.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {summary.dueReviews.map(r => (
                                        <li key={r.id} className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-cream/80">{r.canDo}</span>
                                            <Link
                                                href={`/learn/${r.id}`}
                                                className="flex-shrink-0 rounded-xl border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10"
                                            >
                                                2-min encounter
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    )
}