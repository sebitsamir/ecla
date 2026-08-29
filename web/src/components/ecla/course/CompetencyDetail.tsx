'use client'

/**
 * CompetencyDetail — Phase 27: curriculum visible without textbook feel.
 */
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export type CompetencyEvidence = {
    id: string | number
    code: string
    canDo?: string | null
    status: string
    patterns?: string[]
    evidence?: {
        comprehension?: number | null
        retrieval?: number | null
        interaction?: number | null
        application?: number | null
        transfer?: number | null
        retention?: number | null
    }
}

const EVIDENCE_DIMS = [
    { key: 'comprehension', label: 'Comprehension' },
    { key: 'retrieval', label: 'Retrieval' },
    { key: 'interaction', label: 'Interaction' },
    { key: 'application', label: 'Production' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'retention', label: 'Retention' },
] as const

function evidenceIcon(v?: number | null, mastered?: boolean) {
    if (mastered) return '✓'
    if (v == null) return '○'
    if (v >= 70) return '✓'
    if (v >= 40) return '◐'
    return '○'
}

export default function CompetencyDetail({ competency }: { competency: CompetencyEvidence | null }) {
    if (!competency) {
        return (
            <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
                <p className="text-sm text-cream/50">Select a competency to see what you can do and the evidence ECLA has collected.</p>
            </section>
        )
    }

    const mastered = competency.status === 'mastered'
    const ev = competency.evidence ?? {}

    return (
        <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">Can do</p>
            <p className="mt-2 font-display text-lg font-bold leading-snug text-cream">
                &ldquo;{competency.canDo ?? competency.code}&rdquo;
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-cream/35">{competency.code}</p>

            {competency.patterns && competency.patterns.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-cream/50">Language</p>
                    <ul className="space-y-1">
                        {competency.patterns.slice(0, 5).map(p => (
                            <li key={p} className="text-sm text-cream/80">{p}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-cream/50">Evidence</p>
                <ul className="space-y-1.5">
                    {EVIDENCE_DIMS.map(d => {
                        const v = ev[d.key as keyof typeof ev]
                        return (
                            <li key={d.key} className="flex items-center justify-between text-sm">
                                <span className="text-cream/70">{d.label}</span>
                                <span className={v != null && v >= 70 ? 'text-leaf' : 'text-cream/40'}>
                                    {evidenceIcon(v, mastered && v != null && v >= 60)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {competency.status !== 'locked' && (
                <Link
                    href={`/learn/${competency.code}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-glow py-3 text-sm font-bold text-night-900 transition-all hover:bg-glow/90 active:scale-[0.98]"
                >
                    {competency.status === 'mastered' ? 'Review in scene' : 'Continue'}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
            )}
        </section>
    )
}
