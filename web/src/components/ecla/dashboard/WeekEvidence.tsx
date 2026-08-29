'use client'

/**
 * WeekEvidence — this week's activity as a quiet pulse (Phase D).
 * Boundary note: normalizes at runtime; stat tiles render the probed
 * `stats` array directly (old stats.scenes/wins/xp refs were dead).
 */
import { Activity } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WeekEvidence({ week }: { week?: any }) {
    const w = (week ?? {}) as Record<string, unknown>
    const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    const daysArr = Object.values(w).find(v => Array.isArray(v)) as unknown[] | undefined
    const days = (daysArr ?? []).map((d, i) => {
        if (typeof d === 'number') return { label: DOW[i], count: d }
        const o = (d ?? {}) as Record<string, unknown>
        const n = Object.values(o).find(v => typeof v === 'number')
        return { label: (o.label as string) ?? DOW[i], count: typeof n === 'number' ? n : 0 }
    })

    const stats = Object.entries(w)
        .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
        .slice(0, 3)
        .map(([k, v]) => ({
            l: k.replace(/([A-Z])/g, ' $1').toLowerCase(),
            v: v as number,
        }))

    const max = Math.max(1, ...days.map(d => d.count))
    const hasAnything = days.some(d => d.count > 0) || stats.length > 0

    return (
        <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-cream/50">This week</p>
                <Activity className="h-3.5 w-3.5 text-violet-300" aria-hidden />
            </div>

            {!hasAnything ? (
                <p className="text-sm leading-relaxed text-cream/60">
                    Quiet so far. Your first scene will light this up.
                </p>
            ) : (
                <>
                    {days.length > 0 && (
                        <div className="mb-4 flex h-16 items-end gap-1.5">
                            {days.map((d, i) => (
                                <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1">
                                    <div
                                        className={`w-full rounded-sm transition-all duration-500 ${d.count > 0 ? 'bg-violet-500' : 'bg-white/5'}`}
                                        style={{ height: `${Math.max(8, (d.count / max) * 100)}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div
                        className="mt-auto grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${Math.max(1, stats.length)}, minmax(0, 1fr))` }}
                    >
                        {stats.map(s => (
                            <div key={s.l} className="rounded-xl border border-white/5 bg-white/[0.03] px-2 py-2.5 text-center">
                                <p className="font-display text-lg font-bold text-cream">{s.v}</p>
                                <p className="truncate text-[9px] font-semibold uppercase tracking-widest text-cream/40">{s.l}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}