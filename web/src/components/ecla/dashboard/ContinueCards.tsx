'use client'

/**
 * ContinueCards — nearby curriculum as snap-scroll cards on mobile,
 * grid on desktop (Phase D).
 *
 * Boundary note: accepts BOTH the course map's rich units and the
 * summary API's UnitCard (which omits `description` and may reshape
 * `counts`). Unknowns are normalized at runtime — the card never crashes.
 */
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

/** Lenient on purpose: two different APIs feed this component. */
export type ContinueUnit = {
    id: string | number
    title?: string | null
    description?: string | null
    counts?: unknown
    competencies?: unknown
    href?: string | null
}

const num = (v: unknown): number => (typeof v === 'number' && isFinite(v) ? v : 0)

export default function ContinueCards({ units }: { units?: ContinueUnit[] | null }) {
    const router = useRouter()
    const list = (units ?? []).slice(0, 4)

    /** First competency the learner can actually enter. */
    const firstOpenHref = (u: ContinueUnit): string => {
        if (u.href) return u.href
        const comps = Array.isArray(u.competencies)
            ? (u.competencies as Array<Record<string, unknown>>)
            : []
        const hit = comps.find(c => c.status === 'developing' || c.status === 'upcoming')
        if (typeof hit?.href === 'string') return hit.href
        if (hit?.id != null) return `/learn/${hit.id}`
        return '/course'
    }

    return (
        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
            {list.map((u, i) => {
                const href = firstOpenHref(u)
                const c = (u.counts ?? {}) as Record<string, unknown>
                const mastered = num(c.mastered)
                const open = num(c.developing) + num(c.upcoming)

                return (
                    <button
                        key={u.id}
                        onClick={() => router.push(href)}
                        className="group min-w-[240px] snap-start rounded-2xl border border-white/10 bg-[#13131B] p-5 text-left transition-all duration-300 hover:border-violet-500/40 hover:bg-[#171722] active:scale-[0.98] md:min-w-0"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-cream/60">
                                {i + 1}
                            </span>
                            <ArrowRight className="h-4 w-4 text-cream/30 transition-all group-hover:translate-x-0.5 group-hover:text-glow" />
                        </div>

                        <p className="font-display truncate text-sm font-bold text-cream">
                            {u.title ?? `Unit ${i + 1}`}
                        </p>

                        {u.description && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cream/45">
                                {u.description}
                            </p>
                        )}

                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-cream/35">
                            {mastered}✓ · {open} open
                        </p>
                    </button>
                )
            })}
        </div>
    )
}