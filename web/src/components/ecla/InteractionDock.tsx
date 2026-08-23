'use client'

/**
 * InteractionDock — the learner's control surface for the current beat.
 *
 * Phase 8 additions:
 * - `repairOpen` / `onRepair` props from the engine; when true, renders
 *   the RepairDock (try again / ask to repeat / hear example) instead of
 *   the mic UI — giving the learner agency over recovery (Arts. 11/18).
 * - `showHints` prop: at low support levels, the dock hides the hint
 *   ladder and the "hear an example" repair option.
 * - `unexpected` beat kind: rendered like `speak` but with the gloss
 *   folded into the prompt; repair counts as evidence.
 *
 * Phase 11.3 additions:
 * - `onUnsure` prop + quiet "I'm not sure" button under the mic
 *   (support fading made human, Art. 12).
 */
import { useEffect, useState } from 'react'
import { Keyboard, Send } from 'lucide-react'
import ChoiceGrid from './ChoiceGrid'
import HintLadder from './HintLadder'
import MicButton from './MicButton'
import RepairDock, { type RepairAction } from './RepairDock'
import type { SceneBeat, SceneOption } from '@/lib/sceneTypes'
import type { MicError, MicState } from '@/hooks/useMic'

export default function InteractionDock({
    beat, hintLevel, repairOpen, showHints = true,
    micState, micError,
    onPick, onRepair, onUnsure, onMicStart, onMicStop, onTyped,
}: {
    beat: SceneBeat | undefined
    hintLevel: number
    repairOpen: boolean
    showHints?: boolean
    micState: MicState
    micError: MicError
    onPick: (option: SceneOption) => void
    onRepair: (action: RepairAction) => void
    onUnsure: () => void
    onMicStart: () => void
    onMicStop: () => void
    onTyped: (text: string) => void
}) {
    const [typeMode, setTypeMode] = useState(false)
    const [typed, setTyped] = useState('')

    // Reset per-beat UI; a denied mic drops the learner into typing gracefully.
    useEffect(() => { setTypeMode(false); setTyped('') }, [beat])
    useEffect(() => { if (micError === 'denied') setTypeMode(true) }, [micError])

    if (!beat) return null

    if (beat.kind === 'choice') {
        return (
            <div className="px-4 sm:px-6 pb-5">
                <ChoiceGrid prompt={beat.prompt} options={beat.options} onPick={onPick} />
            </div>
        )
    }

    // Phase 8: `speak` and `unexpected` share the same interaction surface.
    if (beat.kind === 'speak' || beat.kind === 'unexpected') {
        const prompt = beat.kind === 'unexpected'
            ? `They said: "${beat.es}"${beat.gloss ? ` (${beat.gloss})` : ''}. Respond however you can — or repair.`
            : beat.prompt
        const hints = beat.kind === 'speak' ? (beat.hints ?? []) : []

        return (
            <div className="px-4 sm:px-6 pb-6 text-center space-y-3">
                <p className="text-sm text-cream/70">{prompt}</p>

                {/* Hints only when support is still scaffolded (Art. 12). */}
                {showHints && <HintLadder hints={hints} level={hintLevel} />}

                {repairOpen ? (
                    <RepairDock onRepair={onRepair} showExample={showHints} />
                ) : !typeMode ? (
                    <>
                        <MicButton
                            state={micState}
                            onTap={micState === 'recording' ? onMicStop : onMicStart}
                            label={
                                micState === 'recording' ? 'Listening — tap to finish'
                                    : micState === 'processing' ? '…'
                                        : micError === 'network' ? 'Connection problem — try again or type.'
                                            : 'Tap and speak'
                            }
                        />
                        <button
                            onClick={() => setTypeMode(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cream/40 hover:text-cream"
                        >
                            <Keyboard className="h-3 w-3" /> Prefer typing?
                        </button>
                        <button
                            onClick={onUnsure}
                            className="text-[11px] font-bold text-cream/40 transition-colors hover:text-cream"
                        >
                            I'm not sure
                        </button>
                    </>
                ) : (
                    <div className="flex gap-2 max-w-sm mx-auto">
                        <input
                            value={typed}
                            onChange={e => setTyped(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && typed.trim() && (onTyped(typed), setTyped(''))}
                            placeholder="Type it in Spanish…"
                            className="flex-1 rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-2.5 text-sm text-cream focus:outline-none focus:border-violet-500"
                        />
                        <button
                            onClick={() => { onTyped(typed); setTyped('') }}
                            disabled={!typed.trim()}
                            className="rounded-xl bg-white/10 px-3 text-cream disabled:opacity-40"
                            aria-label="Send"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        )
    }

    if (beat.kind === 'listen') {
        return (
            <p className="pb-5 text-center text-[11px] text-cream/40">
                Tap "tap to listen" on the message above.
            </p>
        )
    }

    return null // auto-beats need no controls
}