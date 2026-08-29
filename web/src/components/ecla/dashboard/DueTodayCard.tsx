'use client'

/**
 * DueTodayCard — Phase 26: "People and situations returning."
 * Scene-based reviews due today, not flashcard counts.
 */
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { directionFor } from '@/content/scenes/unitDirections'
import { CAST } from '@/content/cast'
import type { DueReview } from '@/lib/summary'
import type { CharacterId } from '@/lib/sceneTypes'

const charFor = (code?: string): CharacterId => (code ? directionFor(code).cast[0] : 'sofia') ?? 'sofia'

export default function DueTodayCard({ reviews }: { reviews: DueReview[] }) {
    if (!reviews?.length) return null

    return (
        <section className="rounded-2xl border border-glow/20 bg-glow/5 p-5 sm:p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-glow">Due today</p>
            <ul className="space-y-3">
                {reviews.map(rv => {
                    const ch = charFor(rv.code)
                    const name = CAST[ch]?.name ?? 'Sofía'
                    const place = directionFor(rv.code ?? '').sceneNoun ?? 'a familiar place'
                    return (
                        <li key={rv.id ?? rv.code}>
                            <Link
                                href={`/learn/${rv.code}?review=1`}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#13131B] px-4 py-3 transition-colors hover:border-glow/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-cream">{name}</p>
                                    <p className="mt-0.5 text-xs text-cream/50">
                                        {place} — &ldquo;{rv.canDo ?? rv.title}&rdquo;
                                    </p>
                                </div>
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-glow text-night-900">
                                    <ArrowRight className="h-4 w-4" aria-hidden />
                                </span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
