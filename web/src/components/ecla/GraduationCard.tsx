'use client'

/**
 * GraduationCard — Evidence-based graduation (Phase 10).
 *
 * No percentages. No "87/100". No confetti.
 * Just the real-world abilities the learner just demonstrated,
 * and a quiet signal that they're ready for the next CEFR stage.
 * (Constitution Art. 24: Evidence before certification.)
 */
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import type { GatewayEvidence } from '@/lib/gatewayTypes'

/** Maps each Gateway scenario to the real-world ability it demonstrated. */
const SCENARIO_ABILITIES: Record<string, string> = {
    stranger_intro: 'Introduce yourself to someone new',
    shop_purchase: 'Ask for what you need in a shop',
    directions: 'Understand simple directions',
    restaurant_request: 'Order something in a café',
    deliberate_misunderstanding: 'Recover when someone doesn\'t understand you',
    free_objective: 'Sustain a short conversation',
}

export default function GraduationCard({ evidence, onContinue }: {
    evidence: GatewayEvidence[]
    onContinue: () => void
}) {
    return (
        <div className="min-h-screen bg-[#0B0B10] flex items-center justify-center p-6">
            <div className="max-w-lg w-full text-center space-y-8">
                {/* Header */}
                <div>
                    <Sparkles className="h-10 w-10 text-glow mx-auto mb-4" />
                    <h1 className="font-display text-3xl font-bold text-cream mb-2">
                        You did it.
                    </h1>
                    <p className="text-cream/60">
                        You just navigated six real situations in Spanish.
                    </p>
                </div>

                {/* Evidence */}
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-4">
                        Real-world abilities demonstrated
                    </p>
                    <ul className="space-y-3">
                        {evidence.map((e, i) => (
                            <li key={i} className="flex items-start gap-3">
                                {e.communicated ? (
                                    <Check className="h-5 w-5 text-leaf flex-shrink-0 mt-0.5" />
                                ) : (
                                    <span className="h-5 w-5 rounded-full border border-cream/30 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-cream/90">
                                        {SCENARIO_ABILITIES[e.scenario] ?? e.scenario}
                                    </p>
                                    {e.repaired && (
                                        <p className="text-xs text-cream/50 mt-0.5 italic">
                                            You also recovered from a misunderstanding
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CEFR Transition */}
                <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-2">
                        Pre-A1 → A1
                    </p>
                    <p className="text-sm text-cream/80">
                        You are ready to begin handling familiar everyday situations in Spanish.
                    </p>
                </div>

                {/* Continue */}
                <button
                    onClick={onContinue}
                    className="w-full py-4 rounded-xl bg-glow text-night-900 font-bold text-base inline-flex items-center justify-center gap-2 hover:bg-glow/90 transition-colors"
                >
                    Continue your journey <ArrowRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}