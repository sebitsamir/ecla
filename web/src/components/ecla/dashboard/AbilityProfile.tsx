'use client'

/**
 * AbilityProfile — qualitative bands first (Strong / Developing / Needs
 * practice); raw % only on hover. Learners see words, not numbers (§11).
 */
import type { DimensionBand } from '@/lib/summary'

const BAR: Record<string, string> = {
    Strong: 'bg-leaf',
    Developing: 'bg-amber-400',
    'Needs practice': 'bg-coral',
}

export default function AbilityProfile({ dimensions }: { dimensions: DimensionBand[] }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-cream/50">Your Spanish</p>
            <div className="space-y-3">
                {dimensions.map(d => (
                    <div
                        key={d.key}
                        className="flex items-center gap-3"
                        title={d.avg == null ? 'No evidence yet' : `${d.avg}%`}
                    >
                        <span className="w-28 text-xs capitalize text-cream/60">{d.key}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                            <div
                                className={`h-full rounded-full ${BAR[d.band ?? ''] ?? 'bg-white/10'}`}
                                style={{ width: `${d.avg ?? 0}%` }}
                            />
                        </div>
                        <span className="w-24 text-right text-[11px] text-cream/50">{d.band ?? 'No evidence yet'}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}