'use client'

/**
 * StageCard — one unit of the journey (Phase D premium pass + boundary hardening).
 * Smooth grid-rows collapse (no max-height hacks), tactile rows,
 * status language: mastered ✓ / developing ● / upcoming ○ / locked.
 *
 * Boundary note: status/canDo/description are normalized at runtime so
 * unexpected API shapes degrade gracefully instead of crashing or erroring.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Lock } from 'lucide-react'

export type CourseCompetency = {
    id: string | number
    code: string
    canDo?: string | null
    status: string
    prerequisites?: string[]
}

export type CourseUnit = {
    id: string | number
    title: string
    description?: string | null
    counts?: { mastered?: number; developing?: number; upcoming?: number; locked?: number } | null
    competencies?: CourseCompetency[] | null
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'mastered') {
        return (
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-leaf text-night-900 shadow-[0_0_12px_rgba(34,197,94,0.35)]">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
        )
    }
    if (status === 'developing') {
        return (
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-glow bg-glow/10">
                <span className="h-2 w-2 rounded-full bg-glow" />
            </span>
        )
    }
    if (status === 'locked') {
        return (
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-cream/30">
                <Lock className="h-3 w-3" />
            </span>
        )
    }
    return <span className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full border border-white/15" />
}

export default function StageCard({ unit, index, defaultOpen = false }: {
    unit: CourseUnit
    index: number
    defaultOpen?: boolean
}) {
    const router = useRouter()
    const [open, setOpen] = useState(defaultOpen)
    const c = unit.counts ?? {}
    const list = unit.competencies ?? []
    const openCount = (c.developing ?? 0) + (c.upcoming ?? 0)

    return (
        <li className="relative">
            <div className={`overflow-hidden rounded-2xl border bg-[#13131B] transition-colors duration-300 ${
                open ? 'border-violet-500/30' : 'border-white/10 hover:border-white/20'
            }`}>
                {/* Header */}
                <button
                    onClick={() => setOpen(v => !v)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-6"
                >
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        open ? 'bg-violet-600 text-white' : 'bg-white/5 text-cream/60'
                    }`}>
                        {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-base font-bold text-cream sm:text-lg">
                            {unit.title}
                        </span>
                        {unit.description && (
                            <span className="mt-0.5 block truncate text-xs text-cream/45 sm:text-sm">
                                {unit.description}
                            </span>
                        )}
                    </span>
                    <span className="hidden flex-shrink-0 items-center gap-2 text-[11px] font-semibold text-cream/40 sm:flex">
                        <span className="text-leaf">{c.mastered ?? 0}✓</span>
                        <span>·</span>
                        <span>{openCount} open</span>
                        {(c.locked ?? 0) > 0 && (
                            <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                    {c.locked} <Lock className="h-3 w-3" />
                                </span>
                            </>
                        )}
                    </span>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 text-cream/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Body — smooth collapse */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <ul className="border-t border-white/5">
                            {list.map(cp => {
                                const clickable = cp.status !== 'locked'
                                return (
                                    <li key={cp.id}>
                                        <button
                                            onClick={() => clickable && router.push(`/learn/${cp.code}`)}
                                            disabled={!clickable}
                                            aria-disabled={!clickable}
                                            className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors sm:px-6 ${
                                                clickable ? 'hover:bg-white/[0.04] active:bg-white/[0.06]' : 'cursor-not-allowed opacity-45'
                                            }`}
                                        >
                                            <StatusIcon status={cp.status} />
                                            <span className="min-w-0 flex-1">
                                                <span className={`block text-sm leading-snug ${cp.status === 'mastered' ? 'text-cream/70' : 'text-cream/90'}`}>
                                                    {cp.canDo ?? cp.code}
                                                </span>
                                                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-cream/30">
                                                    {cp.code}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </li>
    )
}