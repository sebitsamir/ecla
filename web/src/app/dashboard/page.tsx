'use client'

/**
 * /dashboard — the learning control center.
 * Summary + course map fetched in parallel; loading clears when summary lands.
 */
import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import DueTodayCard from '@/components/ecla/dashboard/DueTodayCard'
import NextActionCard from '@/components/ecla/dashboard/NextActionCard'
import ProvenRing from '@/components/ecla/dashboard/ProvenRing'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import WeekEvidence from '@/components/ecla/dashboard/WeekEvidence'
import ContinueCards, { type ContinueUnit } from '@/components/ecla/dashboard/ContinueCards'
import RetentionCard from '@/components/ecla/dashboard/RetentionCard'
import { fetchSummary, type LearnerSummary } from '@/lib/summary'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function DashboardPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [summary, setSummary] = useState<LearnerSummary | null>(null)
  const [mapUnits, setMapUnits] = useState<ContinueUnit[]>([])
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
        const [sum, map] = await Promise.all([
          fetchSummary(getToken),
          fetch(`${API_URL}/api/v1/course/map`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .catch(() => null),
        ])
        setSummary(sum)
        setMapUnits(map?.courses?.[0]?.units ?? [])
      } catch { /* handled by !summary below */ } finally {
        setLoading(false)
      }
    })()
  }, [getToken, tick])

  return (
    <AppShell>
      {loading ? (
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
          {[0, 1, 2].map(i => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : !summary ? (
        <p className="text-sm text-cream/60">Couldn't load your learning control center. Refresh to retry.</p>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">What can you do now?</p>
            <h1 className="font-display mt-1 text-2xl font-bold text-cream sm:text-3xl md:text-4xl">
              {`Hola, ${summary?.name ?? user?.firstName ?? 'there'}.`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/50">
              {summary.nextAction.reason}
            </p>
          </header>

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Your next step</p>
            <NextActionCard action={summary.nextAction} />
          </section>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <DueTodayCard reviews={summary.dueReviews} />
            </div>
            <div className="min-w-0">
              <ProvenRing demonstrated={summary.demonstrated} total={summary.total} stageLabel="Pre-A1" />
            </div>
          </div>

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Your communication profile</p>
            <AbilityProfile dimensions={summary.dimensions} />
          </section>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <WeekEvidence week={summary.week} />
            <RetentionCard getToken={getToken} />
          </div>

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/50">Continue learning</p>
            <ContinueCards units={mapUnits.length ? mapUnits : summary.units} />
          </section>
        </div>
      )}
    </AppShell>
  )
}