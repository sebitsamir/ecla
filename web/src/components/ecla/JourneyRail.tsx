'use client'

/**
 * JourneyRail — the 9-stage ladder made visible (left rail).
 * Done / current / upcoming derived from the stage the engine reports.
 * The learner sees a journey, not "Exercise 3/12" (Constitution Art. 2/3).
 */
import { Check } from 'lucide-react'
import { STAGE_NAMES, type StageName } from '@/lib/sceneTypes'

export default function JourneyRail({ current }: { current?: StageName }) {
    const idx = current ? STAGE_NAMES.indexOf(current) : -1

    return (
        <aside className="sticky top-20">
            <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-3">Lesson journey</p>
            <ol className="space-y-1">
                {STAGE_NAMES.map((name, i) => {
                    const done = i < idx
                    const active = i === idx
                    return (
                        <li key={name}>
                            <div className={`flex items-center gap-3 rounded-xl px-3 py-2 border transition-colors ${active ? 'border-violet-500/40 bg-violet-600/15' : 'border-transparent'}`}>
                                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${done ? 'bg-green-600 text-white' : active ? 'bg-violet-600 text-white' : 'bg-white/10 text-cream/50'}`}>
                                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                                </span>
                                <span className={`text-sm font-semibold capitalize ${active ? 'text-white' : done ? 'text-cream/70' : 'text-cream/40'}`}>
                                    {name.toLowerCase()}
                                </span>
                            </div>
                        </li>
                    )
                })}
            </ol>
        </aside>
    )
}