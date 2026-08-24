'use client'

/**
 * StageLayout — stage-specific visual language (Phase S3.3 + S3.4 + metadata consolidation).
 *
 * Each of the 9 stages has a distinct layout driven by STAGE_META:
 *   Terminal (RETAIN)       : summary screen, no interaction
 *   Immersive (ENCOUNTER, TRANSFER) : full-bleed backdrop, scene is the hero
 *   Produce (PRODUCE)       : giant centered mic, recording pulse
 *   Interactive (others)    : focused task variants
 *
 * Phase S3.4: ONE shared backdrop config carries character presence,
 * feedback reaction, and speaking-state into every SceneBackdrop call.
 *
 * No string literals for stage matching — all logic flows through metadata.
 */
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { CharacterId } from '@/lib/sceneTypes'
import { isTerminal, isImmersive, stageMeta } from '@/lib/sceneTypes'
import type { SceneEngine } from '@/hooks/useSceneEngine'
import SceneBackdrop from './SceneBackdrop'
import SceneLog from './SceneLog'
import InteractionDock from './InteractionDock'

export default function StageLayout({
    engine, scene, onComplete,
}: {
    engine: SceneEngine
    scene: any
    onComplete: (correct: number, incorrect: number) => void
}) {
    const stage = engine.stage
    const meta = stageMeta(stage)
    const [showNewContext, setShowNewContext] = useState(false)

    // Flash "New Context" badge when entering TRANSFER
    useEffect(() => {
        if (stage === 'TRANSFER') {
            setShowNewContext(true)
            const t = setTimeout(() => setShowNewContext(false), 2400)
            return () => clearTimeout(t)
        }
    }, [stage])

    // ── Shared backdrop config (Phase S3.4) ──
    const presenceChar = (scene.cast?.[0] ?? 'sofia') as CharacterId
    const speaking =
        engine.beat?.kind === 'say' ||
        engine.beat?.kind === 'listen' ||
        engine.beat?.kind === 'unexpected'
    const bd = {
        environment: engine.environment,
        setting: engine.setting,
        title: scene.title,
        timeOfDay: scene.timeOfDay,
        mood: scene.mood,
        character: presenceChar,
        feedback: engine.feedback,
        speaking,
    }

    // ── Terminal stages: RETAIN (celebration + outcomes + evidence) ──
    if (isTerminal(stage)) {
        const total = engine.counts.current.correct + engine.counts.current.incorrect
        const ratio = total > 0 ? engine.counts.current.correct / total : 0
        const score = Math.round(ratio * 100)
        const outcomes = scene.outcomes ?? []

        return (
            <div className="animate-fade-in">
                <SceneBackdrop {...bd} />
                <div className="mx-auto max-w-2xl px-4 py-10">
                    {/* Celebration header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-leaf/15 ring-4 ring-leaf/30">
                            <Check className="h-8 w-8 text-leaf" strokeWidth={3} />
                        </div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-glow">
                            Scene complete
                        </p>
                        <h2 className="font-display text-3xl font-bold text-cream">
                            {scene.title}
                        </h2>
                    </div>

                    {/* Evidence summary — the dimension scores */}
                    <div className="mb-6 rounded-2xl border border-white/10 bg-[#13131B] p-6">
                        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-cream/50">
                            Your evidence
                        </p>
                        <div className="mb-5 flex items-end justify-center gap-2">
                            <span className="font-display text-5xl font-bold text-cream">
                                {score}
                            </span>
                            <span className="mb-1 text-xl text-cream/40">%</span>
                        </div>
                        <p className="text-center text-xs text-cream/50">
                            {engine.counts.current.correct} successful · {engine.counts.current.incorrect} attempts to improve
                        </p>
                        {/* Score bar */}
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-glow via-leaf to-leaf transition-all duration-1000 ease-out"
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>

                    {/* Outcomes — what they can now do */}
                    <div className="rounded-2xl border border-glow/30 bg-glow/5 p-6">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-glow">
                            You can now
                        </p>
                        <ul className="space-y-2.5">
                            {outcomes.map((o: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-cream/90">
                                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-leaf" strokeWidth={3} />
                                    <span>{o}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => onComplete(engine.counts.current.correct, engine.counts.current.incorrect)}
                        className="mt-8 w-full rounded-xl bg-glow py-4 text-sm font-bold text-night-900 shadow-[0_0_30px_rgba(255,200,0,0.25)] transition-all hover:bg-glow/90 active:scale-[0.98]"
                    >
                        Continue your journey →
                    </button>
                </div>
            </div>
        )
    }
    // ── Immersive stages: ENCOUNTER (scene is the hero) and TRANSFER (new context) ──
    if (isImmersive(stage)) {
        const isEncounter = stage === 'ENCOUNTER'
        return (
            <div className="animate-fade-in">
                <div className={`relative ${isEncounter ? 'h-[45vh] min-h-[320px] sm:h-[60vh] sm:min-h-[420px]' : ''}`}>
                    <SceneBackdrop {...bd} />
                    {isEncounter && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0B10]" />
                    )}
                    {stage === 'TRANSFER' && showNewContext && (
                        <div className="animate-context-flash absolute left-1/2 top-6 -translate-x-1/2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-glow/40 bg-glow/10 px-4 py-1.5 backdrop-blur">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-glow" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-glow">
                                    New context
                                </span>
                            </span>
                        </div>
                    )}
                </div>
                <div className={`mx-auto max-w-2xl px-4 py-6 ${isEncounter ? '-mt-8 relative z-10' : ''}`}>
                    <div className={isEncounter ? 'rounded-2xl border border-white/10 bg-[#13131B]/95 p-5 shadow-2xl backdrop-blur' : ''}>
                        <SceneLog lines={engine.lines} onListen={engine.replayLast} />
                        {meta?.interactive && (
                            <div className="mt-4">
                                <InteractionDock engine={engine} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ── Productive stages: PRODUCE emphasizes the mic ──
    if (stage === 'PRODUCE') {
        return (
            <div className="animate-fade-in">
                <SceneBackdrop {...bd} />
                <div className="mx-auto max-w-2xl px-4 py-6">
                    <div className="space-y-4">
                        <SceneLog lines={engine.lines} onListen={engine.replayLast} />
                    </div>
                    {/* Emphasized production zone */}
                    <div className="mt-8 flex flex-col items-center rounded-2xl border border-violet-500/30 bg-violet-600/5 p-8">
                        <p className="mb-6 text-[11px] font-bold uppercase tracking-widest text-violet-300">
                            Your turn
                        </p>
                        <InteractionDock engine={engine} emphasize />
                    </div>
                </div>
            </div>
        )
    }

    // Default: UNDERSTAND / NOTICE / RECOGNIZE / RETRIEVE / INTERACT ──
    return (
        <div className="animate-fade-in">
            <SceneBackdrop {...bd} />
            <div className="mx-auto max-w-2xl px-4 py-6">
                <SceneLog lines={engine.lines} onListen={engine.replayLast} />
                {meta?.interactive && (
                    <div className="mt-4">
                        <InteractionDock engine={engine} />
                    </div>
                )}
            </div>
        </div>
    )
}