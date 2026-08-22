'use client'

/**
 * SceneExperience — three-zone organism with mobile drawers.
 * Desktop: rail left · player center · tools right.
 * Mobile: floating toggles open the rail/tools as overlays.
 */
import { useState } from 'react'
import { ListOrdered, SlidersHorizontal, X } from 'lucide-react'
import JourneyRail from './JourneyRail'
import ScenePlayer from './ScenePlayer'
import ToolsPanel, { type MasteryData, type ToolsData } from './ToolsPanel'
import type { SceneSpec, StageName } from '@/lib/sceneTypes'

type Support = 'maximum' | 'high' | 'medium' | 'low' | 'minimal'

/** Mastery level → scaffolding (support-removal algorithm, §3.4). */
const SUPPORT_BY_LEVEL: Record<string, Support> = {
    NOT_STARTED: 'maximum',
    EXPOSED: 'maximum',
    DEVELOPING: 'medium',
    CONTROLLED: 'low',
    TRANSFERRED: 'minimal',
    RETAINED: 'minimal',
}

export default function SceneExperience({ scene, tools, mastery, getToken, onComplete }: {
    scene: SceneSpec
    tools?: ToolsData
    mastery?: MasteryData | null
    getToken: () => Promise<string | null>
    onComplete: (correct: number, incorrect: number) => Promise<void> | void
}) {
    const [stage, setStage] = useState<StageName | undefined>(undefined)
    const [railOpen, setRailOpen] = useState(false)
    const [toolsOpen, setToolsOpen] = useState(false)
    const support = SUPPORT_BY_LEVEL[mastery?.level ?? 'NOT_STARTED'] ?? 'medium'

    const drawer = 'fixed inset-x-0 top-14 bottom-0 z-40 bg-[#0B0B10]/95 backdrop-blur p-4 overflow-y-auto'

    return (
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_320px] gap-6 px-4 py-6">

            {/* Mobile toggles */}
            <div className="lg:hidden fixed bottom-4 left-4 z-50 flex gap-2">
                <button
                    onClick={() => { setRailOpen(v => !v); setToolsOpen(false) }}
                    aria-label="Lesson journey"
                    className="h-11 w-11 rounded-full bg-[#13131B] border border-white/10 text-cream/70 flex items-center justify-center"
                >
                    {railOpen ? <X className="h-5 w-5" /> : <ListOrdered className="h-5 w-5" />}
                </button>
                <button
                    onClick={() => { setToolsOpen(v => !v); setRailOpen(false) }}
                    aria-label="Tools"
                    className="h-11 w-11 rounded-full bg-[#13131B] border border-white/10 text-cream/70 flex items-center justify-center"
                >
                    {toolsOpen ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
                </button>
            </div>

            {/* Left rail — static on desktop, drawer on mobile */}
            <div className={`${railOpen ? drawer : 'hidden'} lg:block lg:static lg:bg-transparent lg:backdrop-blur-none lg:p-0 lg:z-auto`}>
                <JourneyRail current={stage} />
            </div>

            {/* Center — the living scene */}
            <ScenePlayer
                scene={scene}
                support={support}
                getToken={getToken}
                onStage={setStage}
                onDone={onComplete}
            />

            {/* Right tools — static on xl, drawer below */}
            <div className={`${toolsOpen ? drawer : 'hidden'} xl:block xl:static xl:bg-transparent xl:backdrop-blur-none xl:p-0 xl:z-auto`}>
                <ToolsPanel tools={tools} mastery={mastery} />
            </div>
        </div>
    )
}