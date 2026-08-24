'use client'

/**
 * JourneyRail — the 9-stage ladder made visible (left rail).
 * Phase S3.6: Progress visualization — filled/current/upcoming states,
 * animated connecting line that fills as you progress.
 */
import { Check } from 'lucide-react'
import { STAGE_NAMES, type StageName } from '@/lib/sceneTypes'

export default function JourneyRail({ current, feedback }: {
    current?: StageName
    feedback?: 'correct' | 'incorrect' | null
}) {
    const idx = current ? STAGE_NAMES.indexOf(current) : -1
    const progressPct = idx >= 0 ? Math.min(100, ((idx + 0.5) / STAGE_NAMES.length) * 100) : 0

    return (
        <aside className="sticky top-20">
            <div className="mb-4 flex items-baseline justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-cream/50">
                    Lesson journey
                </p>
                <p className="text-[11px] font-semibold text-cream/30">
                    {idx >= 0 ? `${idx + 1}/${STAGE_NAMES.length}` : '—'}
                </p>
            </div>

            <ol className="relative space-y-1">
                {/* Vertical progress line — fills with green as you advance */}
                <div className="absolute left-[19px] top-3 bottom-3 w-px bg-white/10" aria-hidden>
                    <div
                        className="w-full bg-gradient-to-b from-leaf to-leaf/80 transition-all duration-700 ease-out"
                        style={{ height: `${progressPct}%` }}
                    />
                </div>

                {STAGE_NAMES.map((name, i) => {
                    const done = i < idx
                    const active = i === idx

                    const flashClass = feedback && active
                        ? feedback === 'correct'
                            ? 'animate-flash-green'
                            : 'animate-flash-amber'
                        : ''

                    return (
                        <li key={name} className="relative">
                            <div className={`flex items-center gap-3 rounded-xl px-3 py-2 border transition-all duration-500 ${flashClass} ${
                                active
                                    ? 'border-violet-500/40 bg-violet-600/15 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                                    : 'border-transparent'
                            }`}>
                                {/* Progress dot — state varies by position */}
                                <span className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all duration-500 ${
                                    done
                                        ? 'bg-leaf text-night-900 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                                        : active
                                            ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                                            : 'bg-[#0B0B10] border border-white/15 text-cream/40'
                                }`}>
                                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                                    {active && (
                                        <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-pulse-ring" />
                                    )}
                                </span>
                                <span className={`text-sm font-semibold capitalize transition-colors duration-300 ${
                                    active
                                        ? 'text-white'
                                        : done
                                            ? 'text-cream/70'
                                            : 'text-cream/40'
                                }`}>
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