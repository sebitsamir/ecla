'use client'

/**
 * InteractionDock — the learner's control surface for the current beat.
 * - choice → ChoiceGrid
 * - speak  → prompt + HintLadder + MicButton (+ typing fallback for
 *            accessibility / denied mic; flows through the same grading)
 * - listen → quiet affordance hint (the tap lives on the bubble)
 * The dock owns only its local UI state; all pedagogy lives in useSceneEngine.
 */
import { useEffect, useState } from 'react'
import { Keyboard, Send } from 'lucide-react'
import ChoiceGrid from './ChoiceGrid'
import HintLadder from './HintLadder'
import MicButton from './MicButton'
import type { SceneBeat, SceneOption } from '@/lib/sceneTypes'
import type { MicError, MicState } from '@/hooks/useMic'

export default function InteractionDock({ beat, hintLevel, micState, micError, onPick, onMicStart, onMicStop, onTyped }: {
    beat: SceneBeat | undefined
    hintLevel: number
    micState: MicState
    micError: MicError
    onPick: (option: SceneOption) => void
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

    if (beat.kind === 'speak') {
        return (
            <div className="px-4 sm:px-6 pb-6 text-center space-y-3">
                <p className="text-sm text-cream/70">{beat.prompt}</p>

                <HintLadder hints={beat.hints ?? []} level={hintLevel} />

                {!typeMode ? (
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
                Tap “tap to listen” on the message above.
            </p>
        )
    }

    return null // auto-beats need no controls
}