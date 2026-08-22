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