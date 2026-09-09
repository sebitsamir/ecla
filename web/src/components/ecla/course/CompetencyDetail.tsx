'use client'

/**
 * CompetencyDetail — Phase 27: curriculum visible without textbook feel.
 */
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { sceneTitleFor } from '@/content/sceneTitles'

export type CompetencyEvidence = {
    id: string | number
    code: string
    title?: string | null
    canDo?: string | null
    status: string
    href?: string
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
            <section className="rounded-experience border border-line bg-carbon p-6">
                <p className="text-sm text-stone">Select a capability to see its scene and recorded evidence.</p>
            </section>
        )
    }

    const mastered = competency.status === 'mastered'
    const ev = competency.evidence ?? {}
    const sceneTitle = sceneTitleFor(competency.code, competency.title ?? competency.canDo)
    const href = competency.href ?? `/learn/${competency.id}?mode=STORY`

    return (
        <section className="min-w-0 overflow-hidden rounded-experience border border-line bg-carbon shadow-glow-md">
            <div className="ecla-thread" /><div className="p-5 sm:p-6">
            <div className="flex min-w-0 items-center justify-between gap-3"><p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">Current capability</p><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${mastered ? 'border-success/30 bg-success/10 text-success' : 'border-ember/30 bg-ember/10 text-ember-soft'}`}>{competency.status}</span></div>
            <p className="font-display mt-5 break-words text-2xl leading-snug text-ivory">
                {sceneTitle}
            </p>
            <p className="mt-3 break-words text-sm leading-relaxed text-stone">
                &ldquo;{competency.canDo ?? competency.code}&rdquo;
            </p>
            <p className="mt-2 break-all text-[10px] font-semibold uppercase tracking-[.14em] text-ash">{competency.code}</p>

            {competency.patterns && competency.patterns.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-stone">Language in this scene</p>
                    <ul className="space-y-2">
                        {competency.patterns.slice(0, 5).map(p => (
                            <li key={p} className="flex min-w-0 items-start gap-2 break-words text-sm text-ivory/85"><Circle className="mt-1 size-2 shrink-0 fill-ember text-ember" /><span className="min-w-0">{p}</span></li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.16em] text-stone">Recorded evidence</p>
                <ul className="grid min-w-0 grid-cols-2 gap-2">
                    {EVIDENCE_DIMS.map(d => {
                        const v = ev[d.key as keyof typeof ev]
                        return (
                            <li key={d.key} className="flex min-w-0 items-center justify-between gap-2 rounded-control border border-line bg-obsidian/35 px-3 py-2.5 text-xs">
                                <span className="min-w-0 truncate text-stone">{d.label}</span>
                                <span className={`shrink-0 ${v != null && v >= 70 ? 'text-success' : 'text-ash'}`}>
                                    {v != null && v >= 70 ? <CheckCircle2 className="size-4" aria-label={evidenceIcon(v, mastered && v >= 60)} /> : evidenceIcon(v, mastered && v != null && v >= 60)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {competency.status !== 'locked' && (
                <Link
                    href={href}
                    className="ecla-control mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ember px-4 text-sm font-semibold text-obsidian hover:bg-ember-soft"
                >
                    {competency.status === 'mastered' ? 'Review in scene' : 'Continue'}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
            )}
            </div>
        </section>
    )
}
