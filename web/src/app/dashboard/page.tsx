'use client'

/**
 * /dashboard — the learning control center (Phase 11).
 * Answers one question first: "What is the best thing for me to do
 * right now to improve?" — everything else is evidence and context.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import NextActionCard from '@/components/ecla/dashboard/NextActionCard'
import ProvenRing from '@/components/ecla/dashboard/ProvenRing'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import WeekEvidence from '@/components/ecla/dashboard/WeekEvidence'
import ReviewNudge from '@/components/ecla/dashboard/ReviewNudge'
import ContinueCards from '@/components/ecla/dashboard/ContinueCards'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'
import { useUser } from '@clerk/nextjs'

export default function DashboardPage() {
  const { getToken } = useAuth()
  const [summary, setSummary] = useState<LearnerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()

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
          {[0, 1, 2].map(i => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : !summary ? (
        <p className="text-sm text-cream/60">Couldn't load your learning control center. Refresh to retry.</p>
      ) : (
        <div className="space-y-6">
          {/* Greeting + the adaptive WHY, up front */}
          <header>
            <h1 className="font-display text-2xl font-bold text-cream md:text-3xl">
              {`Hola, ${summary?.name ?? user?.firstName ?? 'there'}.`}
            </h1>
            <p className="mt-1 text-sm text-cream/50">{summary.nextAction.reason}</p>
          </header>

          {/* Row 1: next mission (dominant) + proven ability */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NextActionCard action={summary.nextAction} />
            </div>
            <ProvenRing demonstrated={summary.demonstrated} total={summary.total} stageLabel="Pre-A1" />
          </div>

          {/* Row 2: ability bands + week evidence + retention nudge */}
          <div className="grid gap-6 lg:grid-cols-3">
            <AbilityProfile dimensions={summary.dimensions} />
            <WeekEvidence week={summary.week} />
            {summary.dueReviews.length > 0 ? (
              <ReviewNudge review={summary.dueReviews[0]} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cream/50">Retention</p>
                <p className="text-sm text-cream/60">
                  Nothing is fading yet. Retrievals will appear here as life, not homework.
                </p>
              </div>
            )}
          </div>

          {/* Row 3: nearby curriculum */}
          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Continue learning</p>
            <ContinueCards units={summary.units} />
          </section>
        </div>
      )}
    </AppShell>
  )
}