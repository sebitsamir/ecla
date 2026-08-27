'use client'

/**
 * NextActionCard — the dominant "what now" surface (Phase D premium pass).
 * Adaptive WHY line included; CTA drops straight into the scene.
 */
import Link from 'next/link'
import { ArrowRight, Lightbulb } from 'lucide-react'

export type NextAction = {
    code?: string
    competencyCode?: string
    title?: string
    label?: string
    description?: string
    canDo?: string
    reason?: string
}

export default function NextActionCard({ action }: { action: NextAction }) {
    const code = action?.code ?? action?.competencyCode
    const title = action?.title ?? action?.label ?? 'Keep going'
    const description = action?.description ?? action?.canDo

    return (
        <section className="flex h-full flex-col rounded-2xl border border-glow/25 bg-[#13131B] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">
                Your next mission
            </p>
            <h2 className="font-display mt-2 text-xl font-bold leading-tight text-cream sm:text-2xl">
                {title}
            </h2>
            {description && (
                <p className="mt-2 text-sm leading-relaxed text-cream/60">{description}</p>
            )}
            {action?.reason && (
                <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-cream/45">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-glow" />
                    {action.reason}
                </p>
            )}
            <div className="mt-auto pt-5">
                <Link
                    href={code ? `/learn/${code}` : '/course'}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-glow py-3.5 text-sm font-bold text-night-900 shadow-[0_0_24px_rgba(255,200,0,0.2)] transition-all hover:bg-glow/90 active:scale-[0.98] sm:w-auto sm:px-6"
                >
                    Enter the scene <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    )
}