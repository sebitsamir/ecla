'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import HomeExperience from '@/components/ecla/home/HomeExperience'
import { Skeleton } from '@/components/ui'
import { useAuthReady, useProgressTick } from '@/hooks/useAuthReady'
import { fetchHome, invalidateHomeCache, type LearnerHome } from '@/lib/summary'
import { ApiError } from '@/lib/apiClient'

function HomeLoading() {
  return (
    <div role="status" aria-label="Preparing your next step" className="space-y-8">
      <div className="relative min-h-[520px] overflow-hidden rounded-experience border border-line bg-ink p-6 sm:p-10">
        <p className="text-xs tracking-[.16em] text-ember-soft">Preparing your next step...</p>
        <Skeleton className="mt-5 h-24 max-w-xl sm:h-36" />
        <div className="absolute inset-x-5 bottom-5 sm:inset-x-10 sm:bottom-10"><Skeleton className="h-36" /></div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
    </div>
  )
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuthReady()
  const { user } = useUser()
  const tick = useProgressTick()
  const [home, setHome] = useState<LearnerHome | null>(null)
  const [loadError, setError] = useState<ApiError | null>(null)
  const [isLoading, setLoading] = useState(true)

  const loading = isSignedIn && isLoading
  const error = isLoaded && !isSignedIn
    ? new ApiError('unauthorized', 'Your session needs to be renewed.', 401)
    : loadError

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        if (tick > 0) invalidateHomeCache(userId)
        const data = await fetchHome(getToken, { force: tick > 0, userId })
        if (!cancelled) setHome(data)
      } catch (reason) {
        if (!cancelled) setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not load your learning world.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isLoaded, isSignedIn, userId, getToken, tick])

  return (
    <AppShell>
      {!isLoaded || loading ? (
        <HomeLoading />
      ) : error ? (
        <div className="mx-auto max-w-2xl py-16">
          <ApiState error={error} onRetry={() => {
            if (userId) invalidateHomeCache(userId)
            window.location.reload()
          }} />
          <p className="mt-4 text-center text-xs text-ash">Your progress is safe.</p>
        </div>
      ) : home ? (
        <HomeExperience home={home} fallbackName={user?.firstName} />
      ) : (
        <div className="mx-auto max-w-2xl border-y border-line py-12 text-center">
          <h1 className="font-display text-3xl text-ivory">Your learning world is still taking shape.</h1>
          <p className="mt-3 text-sm leading-6 text-stone">Refresh to reconnect. Your recorded progress has not been changed.</p>
        </div>
      )}
    </AppShell>
  )
}
