'use client'

/**
 * RepairDock — ECLA's signature mechanic (I3 REPAIR as survival skill).
 * When the NPC didn't understand, the learner chooses the next move:
 * try again, ask them to repeat, or hear an example.
 * `showExample` is hidden at low support levels (support fading, Art. 12).
 */
import { Mic, RefreshCcw, Volume2 } from 'lucide-react'

export type RepairAction = 'retry' | 'repeat' | 'example'

export default function RepairDock({ onRepair, showExample = true }: {
    onRepair: (action: RepairAction) => void
    showExample?: boolean
}) {
    return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <p className="text-sm text-amber-200 font-semibold">They didn't understand. What can you do?</p>
            <div className="grid sm:grid-cols-3 gap-2">
                <button
                    onClick={() => onRepair('retry')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A1A24] px-3 py-2.5 text-sm text-cream/80 hover:border-white/25"
                >
                    <Mic className="h-4 w-4" /> Try again
                </button>
                <button
                    onClick={() => onRepair('repeat')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A1A24] px-3 py-2.5 text-sm text-cream/80 hover:border-white/25"
                >
                    <RefreshCcw className="h-4 w-4" /> Ask them to repeat
                </button>
                {showExample && (
                    <button
                        onClick={() => onRepair('example')}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A1A24] px-3 py-2.5 text-sm text-cream/80 hover:border-white/25"
                    >
                        <Volume2 className="h-4 w-4" /> Hear an example
                    </button>
                )}
            </div>
        </div>
    )
}