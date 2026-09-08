'use client'

/**
 * NextActionCard — the dominant "what now" surface.
 * Uses adaptive href (includes mode + review) — never hardcodes STORY-only links.
 */
import Link from 'next/link'
import { ArrowRight, Lightbulb } from 'lucide-react'

export type NextAction = {
    kind?: string
    code?: string
    competencyCode?: string
    title?: string
    label?: string
    description?: string
    canDo?: string
    reason?: string
    href?: string
    mode?: string
}

export default function NextActionCard({ action }: { action: NextAction }) {
    const code = action?.code ?? action?.competencyCode
    const title = action?.title ?? action?.label ?? 'Keep going'
    const description = action?.description ?? action?.canDo
    const href = action?.href ?? (code ? `/learn/${code}` : '/course')
    const cta = action?.kind === 'review'
        ? 'Enter the scene'
        : action?.kind === 'gateway'
            ? 'Open the gateway'
            : 'Enter the scene'

    return (
        <section className="relative flex h-full flex-col overflow-hidden rounded-experience border border-ember/30 bg-carbon p-5 shadow-glow-md sm:p-6">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,122,61,.18),transparent_55%)]" />
            <div className="relative flex h-full flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">
                {action?.kind === 'review' ? 'Due today' : 'Your next step'}
            </p>
            <h2 className="font-display mt-3 text-2xl leading-tight text-ivory">
                {title}
            </h2>
            {description && (
                <p className="mt-3 text-sm leading-relaxed text-stone">{description}</p>
            )}
            {action?.reason && (
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-stone">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-ember-soft" />
                    {action.reason}
                </p>
            )}
            <div className="mt-auto pt-5">
                <Link
                    href={href}
                    className="ecla-control inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ember px-6 text-sm font-semibold text-obsidian hover:bg-ember-soft"
                >
                    {cta} <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            </div>
        </section>
    )
}
