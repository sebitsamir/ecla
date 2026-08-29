'use client'

/**
 * SceneExperience — three-zone organism with mobile drawers (Phase S3.3 + S3.5 + S3.7 + Adaptive + Phase 3).
 * Phase S3.7: mobile toggles are ONE centered pill with bottom clearance.
 * Adaptive: support level tuned by recent accuracy (this competency or learner average).
 * Phase 3: onComplete now receives structured evidence as the 3rd argument.
 */
import { useState, useEffect } from 'react'
import { ListOrdered, SlidersHorizontal, X } from 'lucide-react'
import { useSceneEngine } from '@/hooks/useSceneEngine'
import { useSceneAudio } from '@/hooks/useSceneAudio'
import JourneyRail from './JourneyRail'
import StageLayout from './StageLayout'
import ToolsPanel, { type MasteryData, type ToolsData } from './ToolsPanel'
import AudioControls from './AudioControls'
import type { SceneSpec } from '@/lib/sceneTypes'
import { recommendSupport } from '@/lib/support'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function SceneExperience({ scene, tools, mastery, getToken, onComplete }: {
    scene: SceneSpec
    tools?: ToolsData
    mastery?: MasteryData | null
    getToken: () => Promise<string | null>
    // Phase 3: Accept structured evidence as the 3rd argument
    onComplete: (correct: number, incorrect: number, evidence?: any) => void
}) {
    const [railOpen, setRailOpen] = useState(false)
    const [toolsOpen, setToolsOpen] = useState(false)
    const [recentAccuracy, setRecentAccuracy] = useState<number | null>(null)

    // Adaptive loop: fetch recent session accuracy to tune scaffolding
    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const r = await fetch(`${API_URL}/api/v1/learner/recent-accuracy`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const j = await r.json()
                if (typeof j?.recentAccuracy === 'number') setRecentAccuracy(j.recentAccuracy)
            } catch { /* fail soft: base support from level */ }
        })()
    }, [getToken])

    // Adaptive support: mastery level + recent accuracy
    const support = recommendSupport(mastery, recentAccuracy)

    const engine = useSceneEngine({ scene, support, getToken })

    // Phase S3.5: ambient + SFX
    const { isMuted, toggleMute } = useSceneAudio(scene.environment, engine.stage, engine.feedback)

    const drawer =
        'fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto bg-[#0B0B10]/95 p-4 backdrop-blur'

    return (
        <>
            <AudioControls isMuted={isMuted} onToggle={toggleMute} />

            {/* pb-24 on mobile leaves room for the floating pill above the dock */}
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 pb-24 pt-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:pb-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">

                {/* ── Mobile toggles — one compact pill, clear of the dock ── */}
                <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[#13131B]/90 px-1.5 py-1 shadow-xl backdrop-blur lg:hidden">
                    <button
                        onClick={() => { setRailOpen(v => !v); setToolsOpen(false) }}
                        aria-label="Lesson journey"
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                            railOpen ? 'bg-glow text-night-900' : 'text-cream/70 hover:text-cream'
                        }`}
                    >
                        {railOpen ? <X className="h-4 w-4" /> : <ListOrdered className="h-4 w-4" />}
                    </button>
                    <span className="h-5 w-px bg-white/10" aria-hidden />
                    <button
                        onClick={() => { setToolsOpen(v => !v); setRailOpen(false) }}
                        aria-label="Tools"
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                            toolsOpen ? 'bg-glow text-night-900' : 'text-cream/70 hover:text-cream'
                        }`}
                    >
                        {toolsOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                    </button>
                </div>

                {/* ── Left rail ── */}
                <div className={`${railOpen ? drawer : 'hidden'} lg:static lg:z-auto lg:block lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}>
                    <JourneyRail current={engine.stage} feedback={engine.feedback} />
                </div>

                {/* ── Center: the living scene ── */}
                <div className="min-w-0">
                    <StageLayout engine={engine} scene={scene} onComplete={onComplete} />
                </div>

                {/* ── Right tools ── */}
                <div className={`${toolsOpen ? drawer : 'hidden'} xl:static xl:z-auto xl:block xl:bg-transparent xl:p-0 xl:backdrop-blur-none`}>
                    <ToolsPanel tools={tools} mastery={mastery} />
                </div>
            </div>
        </>
    )
}