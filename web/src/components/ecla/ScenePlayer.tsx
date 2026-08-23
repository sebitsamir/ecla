'use client'

/**
 * ScenePlayer — orchestrates one SceneSpec end-to-end.
 * Composes SceneBackdrop + SceneLog + InteractionDock + EvidenceCard around
 * the useSceneEngine state machine. Owns only the "saving" UI state;
 * evidence persistence is the page's job (onDone).
 *
 * Phase 8: passes `repairOpen`, `onRepair`, and `showHints` from the engine
 * to the InteractionDock so the learner's agency on failure (repair/retry/
 * example) and support-fading are honored.
 *
 * Phase 11.3: quiet "?" help popover (Hear again / I'm not sure) — support
 * is available but never loud; and `onUnsure` wired into the dock.
 */
import { useState } from 'react'
import { useSceneEngine } from '@/hooks/useSceneEngine'
import SceneBackdrop from './SceneBackdrop'
import SceneLog from './SceneLog'
import InteractionDock from './InteractionDock'
import EvidenceCard from './EvidenceCard'
import type { SceneSpec } from '@/lib/sceneTypes'

export default function ScenePlayer({ scene, support = 'medium', getToken, onStage, onDone }: {
    scene: SceneSpec
    support?: 'maximum' | 'high' | 'medium' | 'low' | 'minimal'
    getToken: () => Promise<string | null>
    onStage?: (stage: any) => void
    onDone: (correct: number, incorrect: number) => Promise<void> | void
}) {
    const engine = useSceneEngine({ scene, support, getToken, onStage })
    const [saving, setSaving] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)

    const handleContinue = async () => {
        setSaving(true)
        try {
            await onDone(engine.counts.current.correct, engine.counts.current.incorrect)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="rounded-2xl border border-white/10 bg-[#13131B] overflow-hidden min-w-0">
            <SceneBackdrop
                environment={engine.environment}
                setting={engine.setting}
                title={engine.finished ? undefined : scene.title}
            />

            {/* ── Quiet help row (Phase 11.3): title + unobtrusive "?" ── */}
            {!engine.finished && (
                <div className="flex items-center justify-between px-4 pt-3">
                    <p className="text-[11px] uppercase tracking-widest text-cream/40">{scene.title}</p>
                    <div className="relative">
                        <button
                            onClick={() => setHelpOpen(v => !v)}
                            aria-label="Help"
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-cream/50 transition-colors hover:text-cream"
                        >
                            ?
                        </button>
                        {helpOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#1A1A24] p-2 shadow-2xl animate-fade-in">
                                <button
                                    onClick={() => { engine.replayLast(); setHelpOpen(false) }}
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-cream/80 hover:bg-white/5"
                                >
                                    Hear again
                                </button>
                                <button
                                    onClick={() => { engine.unsure(); setHelpOpen(false) }}
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-cream/80 hover:bg-white/5"
                                >
                                    I'm not sure
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <SceneLog lines={engine.lines} onListen={engine.listenTap} />
            {engine.finished ? (
                <EvidenceCard
                    outcomes={scene.outcomes}
                    developing="keep a conversation going — developing"
                    onContinue={handleContinue}
                    saving={saving}
                />
            ) : (
                <InteractionDock
                    beat={engine.beat}
                    hintLevel={engine.hintLevel}
                    repairOpen={engine.repairOpen}
                    showHints={engine.showHints}
                    onRepair={engine.repairChoice}
                    onUnsure={engine.unsure}
                    micState={engine.micState}
                    micError={engine.micError}
                    onPick={engine.pick}
                    onMicStart={engine.startMic}
                    onMicStop={engine.stopMic}
                    onTyped={engine.submitTyped}
                />
            )}
        </section>
    )
}