'use client'

/**
 * ProvenRing — demonstrated vs total, as one calm ring (Phase D).
 */
export default function ProvenRing({ demonstrated, total, stageLabel }: {
    demonstrated: number
    total: number
    stageLabel: string
}) {
    const pct = total > 0 ? Math.min(1, demonstrated / total) : 0
    const R = 52
    const C = 2 * Math.PI * R

    return (
        <section className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#13131B] p-6">
            <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r={R} fill="none" strokeWidth="8" className="stroke-white/5" />
                    <circle
                        cx="60" cy="60" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
                        className="stroke-glow transition-[stroke-dashoffset] duration-1000 ease-out"
                        strokeDasharray={C}
                        strokeDashoffset={C * (1 - pct)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="font-display text-3xl font-bold text-cream">{demonstrated}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-cream/40">of {total}</p>
                </div>
            </div>
            <p className="mt-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream/50">
                {stageLabel} · demonstrated
            </p>
        </section>
    )
}