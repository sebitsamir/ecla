'use client'

import { API_URL } from '@/lib/apiClient'

/**
 * /review — Phase 29: scene-based spaced retrieval.
 * "People and situations are returning" — not flashcard #327.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { ArrowRight, MapPin } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
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

const charFor = (code: string): CharacterId => directionFor(code).cast[0] ?? 'sofia'

export default function ReviewPage() {
    const { getToken } = useAuth()
    const [due, setDue] = useState<ReviewItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/adaptive/review`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) throw new Error('Could not load reviews')
                const data = await res.json()
                setDue(data.due ?? [])
            } catch {
                setError('Could not load your review queue. Try refreshing.')
            } finally {
                setLoading(false)
            }
        })()
    }, [getToken])

    return (
        <AppShell>
            <div className="mx-auto max-w-lg space-y-6 py-4 sm:py-8">
                <header>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">Spaced retrieval</p>
                    <h1 className="font-display mt-1 text-2xl font-bold text-cream sm:text-3xl">People remember you</h1>
                    <p className="mt-2 text-sm text-cream/50">
                        Step back into a familiar situation — retrieve the language naturally.
                    </p>
                </header>

                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
                        ))}
                    </div>
                ) : error ? (
                    <p className="rounded-2xl border border-coral/30 bg-coral/5 p-4 text-sm text-coral">{error}</p>
                ) : due.length === 0 ? (
                    <section className="rounded-2xl border border-white/10 bg-[#13131B] p-8 text-center">
                        <p className="text-sm text-cream/60">All caught up. Nothing due right now.</p>
                        <Link
                            href="/dashboard"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-glow px-5 py-3 text-sm font-bold text-night-900"
                        >
                            Back to dashboard <ArrowRight className="h-4 w-4" />
                        </Link>
                    </section>
                ) : (
                    <ul className="space-y-4">
                        {due.map(rv => {
                            const ch = charFor(rv.code)
                            const name = CAST[ch]?.name ?? 'Sofía'
                            const dir = directionFor(rv.code)
                            const place = dir.sceneNoun ?? dir.environment
                            return (
                                <li key={rv.id ?? rv.code}>
                                    <Link
                                        href={`/learn/${rv.code}?review=1`}
                                        className="block rounded-2xl border border-white/10 bg-[#13131B] p-5 transition-colors hover:border-glow/40"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-display text-lg font-bold text-cream">{name}</p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-cream/45">
                                                    <MapPin className="h-3 w-3" aria-hidden />
                                                    {place}
                                                </p>
                                                <p className="mt-3 text-sm leading-relaxed text-cream/70">
                                                    &ldquo;Hey, remember when you {rv.canDo?.toLowerCase() ?? 'practiced this'}?&rdquo;
                                                </p>
                                            </div>
                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-glow text-night-900">
                                                <ArrowRight className="h-5 w-5" aria-hidden />
                                            </span>
                                        </div>
                                        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-glow">
                                            Enter scene
                                        </p>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </AppShell>
    )
}
