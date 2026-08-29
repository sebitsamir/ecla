'use client'

/**
 * /dashboard — the learning control center.
 * One API call (/learner/home) loads everything.
 */
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import DueTodayCard from '@/components/ecla/dashboard/DueTodayCard'
import NextActionCard from '@/components/ecla/dashboard/NextActionCard'
import ProvenRing from '@/components/ecla/dashboard/ProvenRing'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import WeekEvidence from '@/components/ecla/dashboard/WeekEvidence'
import ContinueCards from '@/components/ecla/dashboard/ContinueCards'
import RetentionCard from '@/components/ecla/dashboard/RetentionCard'
import { useAuthReady, useProgressTick } from '@/hooks/useAuthReady'
import { fetchHome, invalidateHomeCache, type LearnerHome } from '@/lib/summary'
import { ApiError } from '@/lib/apiClient'

export default function DashboardPage() {
  const { isLoaded, isSignedIn, getToken } = useAuthReady()
  const { user } = useUser()
  const tick = useProgressTick()
  const [home, setHome] = useState<LearnerHome | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setLoading(false)
      setError(new ApiError('unauthorized', 'Please sign in to continue.', 401))
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        if (tick > 0) invalidateHomeCache()
        const data = await fetchHome(getToken, { force: tick > 0 })
        if (!cancelled) setHome(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e : new ApiError('network', 'Could not load your dashboard.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [isLoaded, isSignedIn, getToken, tick])

  const summary = home?.summary

  return (
    <AppShell>
      {!isLoaded || loading ? (
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
          {[0, 1, 2].map(i => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <ApiState error={error} onRetry={() => { invalidateHomeCache(); window.location.reload() }} />
      ) : !summary ? (
        <p className="text-sm text-cream/60">Couldn&apos;t load your learning control center. Refresh to retry.</p>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">What can you do now?</p>
            <h1 className="font-display mt-1 text-2xl font-bold text-cream sm:text-3xl md:text-4xl">
              {`Hola, ${summary.name ?? user?.firstName ?? 'there'}.`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/50">
              {summary.nextAction?.reason ?? 'Your next step in the journey.'}
            </p>
          </header>

          {summary.nextAction && (
            <section>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Your next step</p>
              <NextActionCard action={summary.nextAction} />
            </section>
          )}

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <DueTodayCard reviews={summary.dueReviews ?? []} />
            </div>
            <div className="min-w-0">
              <ProvenRing demonstrated={summary.demonstrated} total={summary.total} stageLabel="Pre-A1" />
            </div>
          </div>

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Your communication profile</p>
            <AbilityProfile dimensions={summary.dimensions ?? []} />
          </section>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <WeekEvidence week={summary.week} />
            <RetentionCard reviews={home?.retentionReviews} />
          </div>

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Continue learning</p>
            <ContinueCards units={home?.courses?.[0]?.units ?? summary.units} />
          </section>
        </div>
      )}
    </AppShell>
  )
}
