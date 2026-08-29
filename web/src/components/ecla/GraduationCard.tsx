'use client'

/**
 * GraduationCard — Phase 16 evidence-based graduation.
 * Eight qualitative dimensions; PRE-A1 READY only when evidence supports it.
 */
import { Check, ArrowRight, AlertCircle } from 'lucide-react'
import type { GatewayEvidence } from '@/lib/gatewayTypes'

export type GatewayGraduation = {
    preA1Ready: boolean
    communicated: number
    repaired: number
    total: number
    dimensions: Record<string, 'Strong' | 'Developing' | 'Needs practice'>
}

const SCENARIO_ABILITIES: Record<string, string> = {
    stranger_intro: 'Introduce yourself to someone new',
    shop_purchase: 'Ask for what you need in a shop',
    directions: 'Understand simple directions',
    restaurant_request: 'Order something in a café',
    deliberate_misunderstanding: 'Recover when someone doesn\'t understand you',
    free_objective: 'Sustain a short conversation',
}

const DIMENSION_LABELS: Record<string, string> = {
    meaning: 'Meaning',
    comprehension: 'Comprehension',
    production: 'Production',
    interaction: 'Interaction',
    repair: 'Repair',
    transfer: 'Transfer',
    intelligibility: 'Intelligibility',
    independence: 'Independence',
}

const bandColor = (band: string) => {
    if (band === 'Strong') return 'text-leaf border-leaf/30 bg-leaf/10'
    if (band === 'Developing') return 'text-glow border-glow/30 bg-glow/10'
    return 'text-cream/50 border-white/10 bg-white/5'
}

export default function GraduationCard({ evidence, graduation, onContinue }: {
    evidence: GatewayEvidence[]
    graduation?: GatewayGraduation | null
    onContinue: () => void
}) {
    const ready = graduation?.preA1Ready ?? false

    return (
        <div className="min-h-screen bg-[#0B0B10] flex items-center justify-center p-6">
            <div className="max-w-lg w-full text-center space-y-8">
                <div>
                    {ready ? (
                        <Check className="h-10 w-10 text-leaf mx-auto mb-4" strokeWidth={3} />
                    ) : (
                        <AlertCircle className="h-10 w-10 text-glow mx-auto mb-4" />
                    )}
                    <h1 className="font-display text-3xl font-bold text-cream mb-2">
                        {ready ? 'Pre-A1 ready.' : 'Keep going.'}
                    </h1>
                    <p className="text-cream/60">
                        {ready
                            ? 'The evidence supports real-world communication at Pre-A1.'
                            : 'You navigated real situations — more practice will strengthen the evidence.'}
                    </p>
                </div>

                {graduation && (
                    <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-4">
                            Communication profile
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(graduation.dimensions).map(([key, band]) => (
                                <div key={key} className={`rounded-lg border px-3 py-2 ${bandColor(band)}`}>
                                    <p className="text-[10px] uppercase tracking-wider opacity-70">
                                        {DIMENSION_LABELS[key] ?? key}
                                    </p>
                                    <p className="text-sm font-semibold">{band}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-4">
                        Situations navigated
                    </p>
                    <ul className="space-y-3">
                        {evidence.map((e, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-leaf flex-shrink-0 mt-0.5" strokeWidth={3} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-cream/90">
                                        {SCENARIO_ABILITIES[e.scenario] ?? e.scenario}
                                    </p>
                                    {e.repaired && (
                                        <p className="text-xs text-cream/50 mt-0.5 italic">
                                            Recovered from a misunderstanding
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {ready && (
                    <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-2">
                            Pre-A1 → A1
                        </p>
                        <p className="text-sm text-cream/80">
                            You are ready to begin handling familiar everyday situations in Spanish.
                        </p>
                    </div>
                )}

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
