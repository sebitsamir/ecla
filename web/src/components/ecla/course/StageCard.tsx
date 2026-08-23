'use client'

/**
 * StageCard — one unit of the journey (Phase 11.2).
 * Header: purpose + evidence counts. Body (expandable): competencies as
 * human can-do statements with honest statuses — ✓ mastered · ● developing ·
 * ○ upcoming · locked. Locked rows are visible (the graph is honest)
 * but not clickable.
 */
import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Lock } from 'lucide-react'

export type CourseCompetency = {
    id: string; code: string; title: string; canDo: string
    status: 'mastered' | 'developing' | 'upcoming' | 'locked'
    href: string
}

export type CourseUnit = {
    id: string
    title: string
    description: string | null
    competencies: CourseCompetency[]
    counts: { mastered: number; developing: number; upcoming: number; locked: number; total: number }
}

function StatusIcon({ status }: { status: CourseCompetency['status'] }) {
    if (status === 'mastered') {
        return <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-leaf text-night-900"><Check className="h-3.5 w-3.5" /></span>
    }
    if (status === 'developing') {
        return <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-glow text-night-900"><span className="h-2 w-2 rounded-full bg-night-900" /></span>
    }
    if (status === 'locked') {
        return <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-cream/30"><Lock className="h-3 w-3" /></span>
    }
    return <span className="h-6 w-6 flex-shrink-0 rounded-full border border-white/20" />
}

export default function StageCard({ unit, index, defaultOpen = false }: {
    unit: CourseUnit
    index: number
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    const c = unit.counts
    const complete = c.mastered === c.total && c.total > 0
    const started = c.mastered > 0 || c.developing > 0

    return (
        <li className="relative pl-12">
            {/* Journey node on the vertical line */}
            <span className={`absolute left-0 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                complete ? 'bg-leaf text-night-900'
                    : started ? 'bg-glow text-night-900'
                        : 'border border-white/15 bg-[#0B0B10] text-cream/50'
            }`}>
                {complete ? <Check className="h-4 w-4" /> : index + 1}
            </span>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#13131B]">
                <button onClick={() => setOpen(v => !v)} className="flex w-full items-center gap-3 p-5 text-left">
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-cream">{unit.title}</p>
                        <p className="mt-0.5 truncate text-xs text-cream/50">{unit.description ?? ''}</p>
                    </div>
                    <p className="hidden flex-shrink-0 text-[11px] text-cream/50 sm:block">
                        {c.mastered}✓ · {c.developing + c.upcoming} open{c.locked > 0 ? ` · ${c.locked}🔒` : ''}
                    </p>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 text-cream/40 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                    <ul className="space-y-1 border-t border-white/5 p-3">
                        {unit.competencies.map(comp => {
                            const row = (
                                <div className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${comp.status === 'locked' ? 'opacity-50' : 'hover:bg-white/5'}`}>
                                    <StatusIcon status={comp.status} />
                                    <div className="min-w-0">
                                        <p className="text-sm text-cream/90">{comp.canDo}</p>
                                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-cream/35">{comp.code}</p>
                                    </div>
                                </div>
                            )
                            return (
                                <li key={comp.id}>
                                    {comp.status === 'locked' ? row : <Link href={comp.href}>{row}</Link>}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </li>
    )
}