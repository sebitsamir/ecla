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
import Image from 'next/image'
import { Check, Compass, Lock, Sparkles } from 'lucide-react'

export default function CoursePage() {
    const { isLoaded, isSignedIn, userId, getToken } = useAuthReady()
    const tick = useProgressTick()
    const [home, setHome] = useState<LearnerHome | null>(null)
    const [loadError, setError] = useState<ApiError | null>(null)
    const [isLoading, setLoading] = useState(true)
    const [selected, setSelected] = useState<CompetencyEvidence | null>(null)

    const loading = isSignedIn && isLoading
    const error = isLoaded && !isSignedIn ? new ApiError('unauthorized', 'Please sign in to continue.', 401) : loadError

    useEffect(() => {
        if (!isLoaded) return
        if (!isSignedIn || !userId) return

        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                if (tick > 0) invalidateHomeCache()
                const data = await fetchHome(getToken, { force: tick > 0, userId })
                if (!cancelled) setHome(data)
            } catch (e) {
                if (!cancelled) setError(e instanceof ApiError ? e : new ApiError('network', 'Could not load your course map.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => { cancelled = true }
    }, [isLoaded, isSignedIn, userId, getToken, tick])

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
    const locked = all.filter(c => c.status === 'locked').length
    const available = all.length - locked

    const hereId = course?.units.find(u => (u.counts?.developing ?? 0) > 0)?.id
        ?? course?.units.find(u => (u.counts?.upcoming ?? 0) > 0)?.id
    const focus = selected ?? all.find(c => c.status === 'developing')
        ?? all.find(c => c.status !== 'locked')
        ?? null

    return (
        <AppShell>
            {!course ? (
                <div className="ecla-surface rounded-experience p-8 text-stone">No published course is available yet.</div>
            ) : (
                <div className="min-w-0 overflow-x-clip">
                    <section className="ecla-dark-scene relative mb-8 min-h-[22rem] overflow-hidden rounded-experience border border-line shadow-[0_30px_100px_rgba(0,0,0,.42)] sm:min-h-[25rem] lg:mb-10 lg:min-h-[27rem] xl:min-h-[29rem]">
                        <Image src="/worlds/spanish-evening-v2.webp" alt="" fill priority sizes="(max-width: 1320px) 100vw, 1240px" className="object-cover" />
                        <div aria-hidden className="absolute inset-0 bg-obsidian/38" />
                        <div className="relative flex min-h-[22rem] max-w-3xl flex-col justify-end p-5 sm:min-h-[25rem] sm:p-8 lg:min-h-[27rem] lg:p-9 xl:min-h-[29rem] xl:p-10">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-ember-soft"><Compass className="size-4" />Spanish · {String(course.level).replace(/_/g, '-')}</p>
                            <h1 className="font-display mt-3 text-4xl leading-[1.02] text-ivory sm:text-5xl lg:text-6xl">{course.title}</h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory/75">{course.units.length} units · {all.length} capabilities · one connected journey through real situations.</p>
                            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
                                <div className="min-w-0 rounded-control border border-white/15 bg-black/35 p-2.5 backdrop-blur-md sm:p-3 lg:p-4"><p className="flex min-w-0 items-center gap-1 text-[9px] uppercase tracking-wide text-ivory/55 sm:gap-1.5 sm:text-[10px]"><Check className="size-3 shrink-0 text-success" /><span className="truncate">Demonstrated</span></p><p className="font-display mt-1 text-2xl lg:text-3xl">{mastered}</p></div>
                                <div className="min-w-0 rounded-control border border-white/15 bg-black/35 p-2.5 backdrop-blur-md sm:p-3 lg:p-4"><p className="flex min-w-0 items-center gap-1 text-[9px] uppercase tracking-wide text-ivory/55 sm:gap-1.5 sm:text-[10px]"><Sparkles className="size-3 shrink-0 text-ember-soft" /><span className="truncate">Developing</span></p><p className="font-display mt-1 text-2xl lg:text-3xl">{developing}</p></div>
                                <div className="min-w-0 rounded-control border border-white/15 bg-black/35 p-2.5 backdrop-blur-md sm:p-3 lg:p-4"><p className="flex min-w-0 items-center gap-1 text-[9px] uppercase tracking-wide text-ivory/55 sm:gap-1.5 sm:text-[10px]"><Lock className="size-3 shrink-0 text-stone" /><span className="truncate">Available</span></p><p className="font-display mt-1 text-2xl lg:text-3xl">{available}</p></div>
                            </div>
                        </div>
                    </section>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-10">
                    <div className="min-w-0">
                        <header className="mb-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">Your route</p><h2 className="font-display mt-2 text-3xl text-ivory sm:text-4xl">Follow the path at your pace.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone">Each unit opens from your recorded progress. Select an available step to enter its real-world scene.</p></header>
                        <ol className="space-y-6">
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

                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:sticky xl:top-20 xl:grid-cols-1 xl:self-start">
                        {summary?.nextAction && <NextActionCard action={summary.nextAction} />}
                        <CompetencyDetail competency={focus ? {
                            id: focus.id,
                            code: focus.code,
                            title: focus.title,
                            canDo: focus.canDo,
                            status: focus.status,
                            href: focus.href,
                            patterns: focus.patterns,
                            evidence: focus.evidence ?? undefined,
                        } : null} />
                        {summary && <AbilityProfile dimensions={summary.dimensions ?? []} />}
                    </div>
                </div>
                </div>
            )}
        </AppShell>
    )
}
