'use client'

/**
 * NextActionCard — the dominant dashboard/course card.
 * Flat, professional surface: no gradients, amber accent line, clear CTA.
 * Never stretches to fill its column (h-full removed).
 */
import Link from 'next/link'
import { ArrowRight, Lightbulb } from 'lucide-react'
import type { NextAction } from '@/lib/summary'

export default function NextActionCard({ action }: { action: NextAction }) {
    return (
        <section className="rounded-2xl border border-white/10 bg-[#13131B] p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-glow">
                    Your next mission
                </p>
                <span className="h-1.5 w-8 rounded-full bg-glow" aria-hidden />
            </div>

            <h2 className="font-display text-lg font-bold leading-snug text-cream sm:text-xl">
                {action.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{action.canDo}</p>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-cream/45">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-glow" />
                <span>{action.reason}</span>
            </p>

            <Link
                href={action.href}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-glow px-5 py-3 text-sm font-bold text-night-900 transition-all hover:bg-glow/90"
            >
                {action.kind === 'gateway' ? 'Prove it' : 'Enter the scene'}
                <ArrowRight className="h-4 w-4" />
            </Link>
        </section>
    )
}