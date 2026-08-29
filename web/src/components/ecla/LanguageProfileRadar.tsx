'use client'

/**
 * LanguageProfileRadar — Phase 28: shape of the learner, not XP.
 */
import type { DimensionBand } from '@/lib/summary'

const LABELS: Record<string, string> = {
    comprehension: 'Listening',
    recall: 'Speaking',
    production: 'Production',
    interaction: 'Interaction',
    transfer: 'Transfer',
    reading: 'Reading',
}

const DEFAULT_DIMS = ['comprehension', 'recall', 'interaction', 'transfer', 'production']

function polar(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function LanguageProfileRadar({ dimensions, focus }: {
    dimensions: DimensionBand[]
    focus?: string | null
}) {
    const byKey = Object.fromEntries((dimensions ?? []).map(d => [d.key, d]))
    const dims = DEFAULT_DIMS.map(k => ({
        key: k,
        label: LABELS[k] ?? k,
        value: byKey[k]?.avg ?? 0,
        band: byKey[k]?.band,
    }))

    const cx = 120
    const cy = 120
    const maxR = 72
    const n = dims.length
    const step = 360 / n

    const gridLevels = [0.25, 0.5, 0.75, 1]
    const points = dims.map((d, i) => polar(cx, cy, (d.value / 100) * maxR, i * step))
    const polygon = points.map(p => `${p.x},${p.y}`).join(' ')

    const focusDim = focus ?? [...dims].sort((a, b) => a.value - b.value)[0]?.key

    return (
        <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-cream/50">
                Your language profile
            </p>
            {focusDim && (
                <p className="mb-4 text-sm text-cream/60">
                    Your biggest opportunity right now is{' '}
                    <span className="font-semibold text-glow">{LABELS[focusDim] ?? focusDim}</span>.
                </p>
            )}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <svg viewBox="0 0 240 240" className="h-48 w-48 flex-shrink-0" role="img" aria-label="Language ability radar chart">
                    {gridLevels.map(level => {
                        const ring = dims.map((_, i) => polar(cx, cy, maxR * level, i * step))
                        return (
                            <polygon
                                key={level}
                                points={ring.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                            />
                        )
                    })}
                    {dims.map((d, i) => {
                        const outer = polar(cx, cy, maxR, i * step)
                        return (
                            <line
                                key={d.key}
                                x1={cx}
                                y1={cy}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth={1}
                            />
                        )
                    })}
                    <polygon
                        points={polygon}
                        fill="rgba(250, 204, 21, 0.2)"
                        stroke="rgb(250, 204, 21)"
                        strokeWidth={2}
                    />
                    {points.map((p, i) => (
                        <circle key={dims[i].key} cx={p.x} cy={p.y} r={4} fill="rgb(250, 204, 21)" />
                    ))}
                    {dims.map((d, i) => {
                        const label = polar(cx, cy, maxR + 18, i * step)
                        return (
                            <text
                                key={d.key}
                                x={label.x}
                                y={label.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-cream/50 text-[9px] font-semibold uppercase"
                            >
                                {d.label.slice(0, 8)}
                            </text>
                        )
                    })}
                </svg>
                <ul className="flex-1 space-y-2 text-sm">
                    {dims.map(d => (
                        <li key={d.key} className="flex items-center justify-between gap-2">
                            <span className={d.key === focusDim ? 'font-semibold text-glow' : 'text-cream/70'}>
                                {d.label}
                            </span>
                            <span className="text-xs text-cream/40">{d.value || '—'}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
