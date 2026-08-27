'use client'

/**
 * AbilityProfile — dimension bands as calm bars (Phase D premium pass).
 * Defensive at the API boundary: accepts common field aliases.
 */
export type Dimension = {
    key?: string
    label?: string
    name?: string
    score?: number | null
    value?: number | null
    percent?: number | null
    pct?: number | null
    band?: string | null
    level?: string | null
}

const BAND_WIDTH: Record<string, number> = { Strong: 82, Developing: 55, Emerging: 25 }

const bandFor = (d: Dimension): string => {
    const b = d.band ?? d.level
    if (b) return b
    const s = d.score ?? d.value ?? 0
    return s >= 70 ? 'Strong' : s >= 40 ? 'Developing' : 'Emerging'
}

const toneFor = (band: string) =>
    band === 'Strong' ? 'bg-leaf' : band === 'Developing' ? 'bg-glow' : 'bg-violet-500'

const textToneFor = (band: string) =>
    band === 'Strong' ? 'text-leaf' : band === 'Developing' ? 'text-glow' : 'text-violet-300'

export default function AbilityProfile({ dimensions }: { dimensions: Dimension[] }) {
    const list = dimensions ?? []
    return (
        <section className="h-full rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream/50">
                Your Spanish
            </p>
            <ul className="space-y-3.5">
                {list.map((d, i) => {
                    const label = d.label ?? d.name ?? d.key ?? `Dimension ${i + 1}`
                    const band = bandFor(d)
                    const raw = d.score ?? d.value ?? d.percent ?? d.pct
                    const score = typeof raw === 'number' && isFinite(raw)
                        ? Math.max(4, Math.min(100, raw))
                        : (BAND_WIDTH[band] ?? 40)
                    return (
                        <li key={label}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                <span className="text-xs font-semibold text-cream/80">{label}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${textToneFor(band)}`}>
                                    {band}
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${toneFor(band)}`}
                                    style={{ width: `${score}%` }}
                                />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}