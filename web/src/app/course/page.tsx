'use client'

/**
 * /course — curriculum map. Shares /learner/home with dashboard (cached).
 */
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import StageCard, { type CourseUnit } from '@/components/ecla/course/StageCard'
import CompetencyDetail, { type CompetencyEvidence } from '@/components/ecla/course/CompetencyDetail'
import AbilityProfile from '@/components/ecla/dashboard/AbilityProfile'
import NextActionCard from '@/components/ecla/dashboard/NextActionCard'
import { useAuthReady, useProgressTick } from '@/hooks/useAuthReady'
import { fetchHome, invalidateHomeCache, type LearnerHome } from '@/lib/summary'
import { ApiError } from '@/lib/apiClient'

export default function CoursePage() {
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const tick = useProgressTick()
    const [home, setHome] = useState<LearnerHome | null>(null)
    const [error, setError] = useState<ApiError | null>(null)
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<CompetencyEvidence | null>(null)

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
                if (!cancelled) setError(e instanceof ApiError ? e : new ApiError('network', 'Could not load your course map.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => { cancelled = true }
    }, [isLoaded, isSignedIn, getToken, tick])

    if (!isLoaded || loading) {
        return (
            <AppShell>
                <div className="space-y-4">
                    <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
            </AppShell>
        )
    }

    if (error) {
        return (
            <AppShell>
                <ApiState error={error} onRetry={() => { invalidateHomeCache(); window.location.reload() }} />
            </AppShell>
        )
    }

    const course = home?.courses?.[0]
    const summary = home?.summary
    const all = (course?.units ?? []).flatMap(u => u.competencies ?? [])
    const mastered = all.filter(c => c.status === 'mastered').length
    const developing = all.filter(c => c.status === 'developing').length
    const ahead = all.length - mastered - developing

    const hereId = course?.units.find(u => (u.counts?.developing ?? 0) > 0)?.id
        ?? course?.units.find(u => (u.counts?.upcoming ?? 0) > 0)?.id

    return (
        <AppShell>
            {!course ? (
                <p className="text-sm text-cream/60">No published course yet.</p>
            ) : (
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="min-w-0">
                        <header className="mb-6 sm:mb-8">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">
                                Spanish · {String(course.level).replace(/_/g, '-')}
                            </p>
                            <h1 className="font-display mt-1 text-2xl font-bold text-cream sm:text-3xl md:text-4xl">
                                {course.title}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-cream/50">
                                Nine units · {all.length} scenes · curriculum from your database, experienced in context.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-[11px] font-semibold text-leaf">
                                    {mastered} demonstrated
                                </span>
                                <span className="rounded-full border border-glow/30 bg-glow/10 px-3 py-1 text-[11px] font-semibold text-glow">
                                    {developing} developing
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-cream/50">
                                    {ahead} ahead
                                </span>
                            </div>
                        </header>

                        <ol className="space-y-3 sm:space-y-4">
                            {course.units.map((u, i) => (
                                <StageCard
                                    key={u.id}
                                    unit={u as CourseUnit}
                                    index={i}
                                    defaultOpen={u.id === hereId}
                                    onSelect={cp => setSelected({
                                        id: cp.id,
                                        code: cp.code,
                                        title: cp.title,
                                        canDo: cp.canDo,
                                        status: cp.status,
                                        href: cp.href,
                                        patterns: cp.patterns,
                                        evidence: cp.evidence ?? undefined,
                                    })}
                                />
                            ))}
                        </ol>
                    </div>

                    <div className="min-w-0 space-y-5 xl:sticky xl:top-20 xl:self-start">
                        {summary?.nextAction && <NextActionCard action={summary.nextAction} />}
                        <CompetencyDetail competency={selected ?? (all[0] ? {
                            id: all[0].id,
                            code: all[0].code,
                            title: all[0].title,
                            canDo: all[0].canDo,
                            status: all[0].status,
                            href: all[0].href,
                            patterns: all[0].patterns,
                            evidence: all[0].evidence ?? undefined,
                        } : null)} />
                        {summary && <AbilityProfile dimensions={summary.dimensions ?? []} />}
                    </div>
                </div>
            )}
        </AppShell>
    )
}
