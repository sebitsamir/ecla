'use client'

/**
 * EvidenceCard — the completion moment (Art. 24: evidence, not points).
 * "You can now…" + one honest "developing" line + Continue.
 * No confetti; the reward is the ability itself.
 */
import { ArrowRight, Check } from 'lucide-react'

export default function EvidenceCard({ outcomes, developing, onContinue, saving }: {
    outcomes: string[]
    developing?: string
    onContinue: () => void
    saving?: boolean
}) {
    return (
        <div className="px-5 sm:px-8 pb-7 pt-2 text-center space-y-5">
            <p className="text-[11px] uppercase tracking-widest text-cream/40">Communication achieved</p>

            <div className="text-left max-w-sm mx-auto space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-1">You can now</p>
                {outcomes.map(outcome => (
                    <p key={outcome} className="text-sm text-cream/80 flex gap-2">
                        <Check className="h-4 w-4 text-leaf flex-shrink-0 mt-0.5" /> {outcome}
                    </p>
                ))}
                {developing && (
                    <p className="text-sm text-cream/50 flex gap-2 pt-1">
                        <span className="text-amber-400">◐</span> {developing}
                    </p>
                )}
            </div>

            <button
                onClick={onContinue}
                disabled={saving}
                className="w-full max-w-sm py-3.5 rounded-xl bg-glow text-night-900 font-bold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
                {saving ? 'Saving…' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    )
}