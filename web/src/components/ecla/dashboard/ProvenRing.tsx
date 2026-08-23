'use client'

/**
 * ProvenRing — evidence, not a vibe: "12/44 competencies demonstrated".
 * Replaces the meaningless single fluency percentage (Art. 24).
 */
export default function ProvenRing({ demonstrated, total, stageLabel }: {
    demonstrated: number
    total: number
    stageLabel: string
}) {
    const pct = total ? demonstrated / total : 0
    const R = 52
    const C = 2 * Math.PI * R

    return (
        <div className="flex h-full flex-col items-center rounded-2xl border border-white/10 bg-[#13131B] p-6">
            <p className="mb-4 self-start text-xs font-bold uppercase tracking-wider text-cream/50">Proven ability</p>
            <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r={R} className="stroke-white/5" strokeWidth="10" fill="none" />
                    <circle
                        cx="60" cy="60" r={R}
                        className="stroke-glow transition-all duration-700"
                        strokeWidth="10" fill="none" strokeLinecap="round"
                        strokeDasharray={`${C * pct} ${C}`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-cream">{demonstrated}/{total}</span>
                </div>
            </div>
            <p className="mt-3 text-xs text-cream/50">demonstrated · {stageLabel}</p>
        </div>
    )
}
