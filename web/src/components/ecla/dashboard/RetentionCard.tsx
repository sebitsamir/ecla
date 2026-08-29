'use client'

/**
 * RetentionCard — spaced retrieval made human (Phase C).
 *
 * "Sofía wants to see you tomorrow."
 * Shows up to 3 learned competencies due for review; the CTA drops the
 * learner straight into the scene (authored scene, or a Street Encounter
 * for mastered competencies without one — the learn page decides).
 *
 * Renders NOTHING when nothing is due — no clutter, no guilt streaks.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { directionFor } from '@/content/scenes/unitDirections'
import { CAST } from '@/content/cast'
import type { CharacterId } from '@/lib/sceneTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Review = { code: string; title: string; level: string; dueInHours: number }

const charFor = (code: string): CharacterId => directionFor(code).cast[0] ?? 'sofia'

const dueLabel = (h: number) => (h <= 0 ? 'due now' : h <= 24 ? 'tomorrow' : `in ${Math.round(h / 24)}d`)

export default function RetentionCard({ getToken }: {
    getToken: () => Promise<string | null>
}) {
    const [reviews, setReviews] = useState<Review[] | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const r = await fetch(`${API_URL}/api/v1/learner/upcoming-reviews`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const j = await r.json()
                setReviews(Array.isArray(j?.reviews) ? j.reviews : [])
            } catch {
                setReviews([])
            }
        })()
    }, [getToken])

    // Nothing due → the card stays invisible. Silence is a feature.
    if (!reviews || reviews.length === 0) return null

    return (
        <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-cream/50">
                    They remember you
                </p>
                <Clock className="h-3.5 w-3.5 text-glow" aria-hidden />
            </div>

            <ul className="space-y-3">
                {reviews.map(rv => {
                    const ch = charFor(rv.code)
                    const name = CAST[ch]?.name ?? 'Sofía'
                    return (
                        <li
                            key={rv.code}
                            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:border-glow/30"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-cream">
                                    {name} wants to see you.
                                </p>
                                <p className="mt-0.5 truncate text-xs text-cream/50">{rv.title}</p>
                            </div>
                            <span className="flex-shrink-0 rounded-full border border-glow/30 bg-glow/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-glow">
                                {dueLabel(rv.dueInHours)}
                            </span>
                            <Link
                                href={`/learn/${rv.code}?review=1`}
                                aria-label={`Review: ${rv.title}`}
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-cream/60 transition-all hover:bg-glow hover:text-night-900 active:scale-95"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </li>
                    )
                })}
            </ul>

            <p className="mt-4 text-[11px] leading-relaxed text-cream/40">
                A quick hello keeps it alive. Thirty seconds now beats an hour later.
            </p>
        </section>
    )
}