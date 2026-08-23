'use client'

/**
 * ReviewNudge — spaced retrieval surfaced as life, not homework (§14):
 * "Daniel is on your street." Routes to the street-encounter scene.
 */
import Link from 'next/link'
import type { DueReview } from '@/lib/summary'

export default function ReviewNudge({ review }: { review: DueReview }) {
    return (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">A familiar face</p>
            <p className="mb-4 text-sm text-cream/80">Daniel is on your street — and he remembers you.</p>
            <Link
                href={`/learn/${review.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/10"
            >
                2-min encounter
            </Link>
        </div>
    )
}