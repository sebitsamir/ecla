'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, MapPin, RotateCcw } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import { Skeleton } from '@/components/ui'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { sceneBackground, sceneMood } from '@/lib/scenePresentation'
import { directionFor } from '@/content/scenes/unitDirections'
import { CAST } from '@/content/cast'
import type { CharacterId } from '@/lib/sceneTypes'

type ReviewItem = {
    id: string
    code: string
    title: string
    canDo: string
    competencyId?: string
}

type ReviewResponse = { due: ReviewItem[] }

const charFor = (code: string): CharacterId => directionFor(code).cast[0] ?? 'sofia'
const reviewHref = (item: ReviewItem) => `/learn/${encodeURIComponent(item.id || item.code)}?review=1`

function reviewContext(item: ReviewItem) {
    const direction = directionFor(item.code)
    const character = CAST[charFor(item.code)] ?? CAST.sofia
    return {
        character,
        place: direction.sceneNoun ?? direction.environment,
        image: sceneBackground[sceneMood(direction.environment)],
    }
}

function reviewHeading(count: number) {
    if (count === 1) return 'One thing is starting to fade.'
    return `${count} things are starting to fade.`
}

function ReviewLoading() {
    return (
        <div role="status" aria-label="Finding what needs practice" className="mx-auto max-w-5xl space-y-7 py-3 sm:py-6">
            <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 max-w-xl sm:h-16" />
                <Skeleton className="h-5 max-w-lg" />
            </div>
            <Skeleton className="h-[28rem] sm:h-80" />
        </div>
    )
}

export default function ReviewPage() {
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const [due, setDue] = useState<ReviewItem[]>([])
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
                const data = await apiFetch<ReviewResponse>('/api/v1/adaptive/review', getToken)
                if (!cancelled) setDue(Array.isArray(data.due) ? data.due : [])
            } catch (reason) {
                if (!cancelled) setError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not load your review.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => { cancelled = true }
    }, [getToken, isLoaded, isSignedIn, requestVersion])

    const error = isLoaded && !isSignedIn
        ? new ApiError('unauthorized', 'Your session needs to be renewed.', 401)
        : loadError
    const first = due[0]
    const remaining = due.slice(1)

    return (
        <AppShell>
            {!isLoaded || (isSignedIn && isLoading) ? (
                <ReviewLoading />
            ) : error ? (
                <div className="mx-auto max-w-2xl py-16">
                    <ApiState error={error} onRetry={() => setRequestVersion(value => value + 1)} />
                    <p className="mt-4 text-center text-xs text-ash">Your learning history is safe.</p>
                </div>
            ) : first ? (
                <div className="mx-auto min-w-0 max-w-5xl py-3 sm:py-6">
                    <header className="max-w-2xl">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-ember-soft"><RotateCcw className="size-4" />Spaced review</p>
                        <h1 className="font-display mt-3 text-4xl leading-[1.04] text-ivory sm:text-5xl lg:text-6xl">{reviewHeading(due.length)}</h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-stone sm:text-base">Return to a familiar moment while the language is still within reach.</p>
                    </header>

                    {(() => {
                        const context = reviewContext(first)
                        return (
                            <section className="mt-8 grid min-w-0 overflow-hidden rounded-experience border border-line bg-carbon shadow-glow-md md:grid-cols-[minmax(0,1.1fr)_minmax(19rem,.9fr)]">
                                <div className="relative min-h-64 overflow-hidden md:min-h-[25rem]">
                                    <Image src={context.image} alt="" fill priority sizes="(max-width: 767px) 100vw, 55vw" className="object-cover" />
                                    <div aria-hidden className="absolute inset-0 bg-obsidian/35" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 md:hidden">
                                        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-ivory/80 backdrop-blur-md"><MapPin className="size-3.5 text-ember-soft" />{context.place}</p>
                                    </div>
                                </div>
                                <div className="flex min-w-0 flex-col justify-center p-5 sm:p-7 md:p-8 lg:p-10">
                                    <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-ember-soft">Begin here</p>
                                    <h2 className="font-display mt-3 break-words text-3xl leading-tight text-ivory">{first.title}</h2>
                                    <p className="mt-4 break-words text-base leading-7 text-ivory/75">{first.canDo}</p>
                                    <div className="mt-5 hidden items-center gap-4 text-xs text-stone md:flex">
                                        <span>{context.character.name}</span><span aria-hidden className="size-1 rounded-full bg-ember" /><span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span className="break-words">{context.place}</span></span>
                                    </div>
                                    <Link href={reviewHref(first)} className="ecla-control mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft sm:w-fit">
                                        Start review <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </section>
                        )
                    })()}

                    {remaining.length > 0 ? (
                        <section className="mt-10 border-t border-line pt-7">
                            <div className="flex flex-wrap items-end justify-between gap-2">
                                <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">After this</p><h2 className="font-display mt-2 text-2xl text-ivory sm:text-3xl">What comes back next</h2></div>
                                <p className="text-xs text-ash">{remaining.length} remaining</p>
                            </div>
                            <ol className="mt-5 divide-y divide-line border-y border-line">
                                {remaining.map((item, index) => {
                                    const context = reviewContext(item)
                                    return (
                                        <li key={item.id || item.code}>
                                            <Link href={reviewHref(item)} className="ecla-control grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 py-4 text-stone hover:text-ivory sm:gap-4 sm:py-5">
                                                <span className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-xs text-ember-soft">{index + 2}</span>
                                                <span className="min-w-0"><span className="block break-words text-sm font-medium text-ivory">{item.title}</span><span className="mt-1 block break-words text-xs leading-5 text-stone">{item.canDo} · {context.character.name}</span></span>
                                                <ArrowRight className="size-4 shrink-0" />
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ol>
                        </section>
                    ) : null}
                </div>
            ) : (
                <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center py-12 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success"><Check className="size-6" /></span>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-success">Memory is holding</p>
                    <h1 className="font-display mt-3 text-4xl text-ivory sm:text-5xl">Nothing needs review yet.</h1>
                    <p className="mt-4 max-w-lg text-sm leading-6 text-stone sm:text-base">Keep learning. Ecla will bring language back when your memory needs the challenge.</p>
                    <Link href="/course" className="ecla-control mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-ember px-6 text-sm font-semibold text-obsidian hover:bg-ember-soft">Continue learning <ArrowRight className="size-4" /></Link>
                </section>
            )}
        </AppShell>
    )
}
