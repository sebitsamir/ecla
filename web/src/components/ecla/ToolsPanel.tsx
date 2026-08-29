'use client'

/**
 * ToolsPanel — the quiet right rail: vocabulary (tap-to-hear), language help,
 * pronunciation, and the mastery snapshot. MasteryBars is exported separately
 * so the dashboard (Phase 12) reuses the exact same visualization.
 */
import { AudioLines, Lightbulb } from 'lucide-react'
import SpeakerButton from '@/components/SpeakerButton'

export type ToolsData = {
    vocabulary?: { word: string; translation: string }[]
    grammar?: string | null
    pronunciation?: string | null
    culture?: string | null
    scenePurpose?: string
    scenePatterns?: string[]
}

export type MasteryData = {
    level: string
    overall: number | null
    dimensions: Record<string, number | null>
}

/** Reusable dimensional bars — the learner model made visible (Art. 20). */
export function MasteryBars({ mastery }: { mastery: MasteryData }) {
    return (
        <div className="space-y-2">
            {Object.entries(mastery.dimensions).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                    <span className="w-24 text-[11px] text-cream/50 capitalize">{key}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${value ?? 0}%` }} />
                    </div>
                    <span className="w-8 text-right text-[11px] text-cream/40">{value == null ? '—' : `${value}%`}</span>
                </div>
            ))}
        </div>
    )
}

export default function ToolsPanel({ tools, mastery }: { tools?: ToolsData; mastery?: MasteryData | null }) {
    return (
        <aside className="space-y-4 sticky top-20">
            {tools?.scenePurpose && (
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2">Your goal</p>
                    <p className="text-sm text-cream/70 leading-relaxed">{tools.scenePurpose}</p>
                </div>
            )}

            {!!tools?.scenePatterns?.length && (
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2">Patterns</p>
                    <ul className="space-y-1.5">
                        {tools.scenePatterns.slice(0, 4).map(p => (
                            <li key={p} className="text-sm text-cream/80 font-mono">{p}</li>
                        ))}
                    </ul>
                </div>
            )}

            {!!tools?.vocabulary?.length && (
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-3">Vocabulary</p>
                    <ul className="space-y-2">
                        {tools.vocabulary.slice(0, 6).map(v => (
                            <li key={v.word} className="flex items-center gap-2 text-sm">
                                <SpeakerButton text={v.word} lang="es-ES" size="sm" />
                                <span className="text-cream/80">{v.word}</span>
                                <span className="ml-auto text-cream/40 text-xs">{v.translation}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {tools?.grammar && (
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" /> Language help
                    </p>
                    <p className="text-sm text-cream/70 leading-relaxed">{tools.grammar}</p>
                </div>
            )}

            {tools?.pronunciation && (
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2 flex items-center gap-1.5">
                        <AudioLines className="h-3.5 w-3.5" /> Pronunciation
                    </p>
                    <p className="text-sm text-cream/70 leading-relaxed">{tools.pronunciation}</p>
                </div>
            )}

            {mastery && (
                <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/50">Mastery</p>
                        <span className="text-xs font-bold text-violet-400">{mastery.level}</span>
                    </div>
                    <MasteryBars mastery={mastery} />
                </div>
            )}
        </aside>
    )
}