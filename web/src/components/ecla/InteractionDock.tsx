'use client'

/**
 * InteractionDock — the learner's action surface.
 * Phase 23: MicButton + mic error surfacing. Phase 25: read/write beats.
 */
import { useState } from 'react'
import { Keyboard, Send } from 'lucide-react'
import type { SceneEngine } from '@/hooks/useSceneEngine'
import type { SceneOption } from '@/lib/sceneTypes'
import MicButton from './MicButton'
import RepairDock from './RepairDock'

export default function InteractionDock({ engine, emphasize = false }: {
    engine: SceneEngine
    emphasize?: boolean
}) {
    const [typeMode, setTypeMode] = useState(false)
    const [typed, setTyped] = useState('')
    const { beat, micState, micError, attempts, repairOpen, showHints, hintLevel } = engine

    if (!beat) return null

    // ── Choice stage ──
    if (beat.kind === 'choice') {
        return (
            <div className="space-y-2">
                <p className="mb-3 text-sm text-cream/80">{beat.prompt}</p>
                {beat.options.map((opt: SceneOption, i: number) => (
                    <button
                        key={i}
                        onClick={() => engine.pick(opt)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-3 text-left text-sm text-cream transition-all duration-200 hover:border-glow/40 hover:bg-white/5 active:scale-[0.98]"
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        )
    }

    // ── Read stage (Phase 25) ──
    if (beat.kind === 'read') {
        return (
            <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-4">
                    <p className="text-base text-cream leading-relaxed font-medium">{beat.passage}</p>
                </div>
                <p className="text-sm text-cream/80">{beat.prompt}</p>
                {beat.options.map((opt: SceneOption, i: number) => (
                    <button
                        key={i}
                        onClick={() => engine.pick(opt)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-3 text-left text-sm text-cream transition-all duration-200 hover:border-glow/40 hover:bg-white/5 active:scale-[0.98]"
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        )
    }

    // ── Listen stage: auto-play handled by scheduler; speaker replays only ──
    if (beat.kind === 'listen') {
        return (
            <p className="text-center text-xs text-cream/45">
                Tap the speaker icon to hear again
            </p>
        )
    }

    // ── Speak / write / unexpected stage ──
    if (beat.kind === 'speak' || beat.kind === 'write' || beat.kind === 'unexpected') {
        const isWrite = beat.kind === 'write'
        const prompt = beat.kind === 'speak' || beat.kind === 'write'
            ? beat.prompt
            : 'Respond naturally — or ask for help.'
        const hints = beat.kind === 'speak' ? (beat.hints ?? []) : []
        const currentHint = showHints && hints.length > 0
            ? hints[Math.min(hintLevel, hints.length - 1)]
            : null
        const preferType = isWrite || typeMode

        return (
            <div className="space-y-4">
                {prompt && (
                    <p className={`text-center ${emphasize ? 'text-base text-cream' : 'text-sm text-cream/80'}`}>
                        {prompt}
                    </p>
                )}

                {currentHint && (
                    <p className="text-center text-xs text-violet-300 italic animate-fade-in">
                        {currentHint}
                    </p>
                )}

                {micError && (
                    <p className="text-center text-xs text-amber-400">
                        {micError === 'denied'
                            ? 'Microphone blocked — type your response instead.'
                            : 'Voice unavailable — type your response instead.'}
                    </p>
                )}

                {!preferType ? (
                    <div className="flex flex-col items-center gap-3">
                        <MicButton
                            state={micState}
                            size={emphasize ? 'lg' : 'md'}
                            onTap={micState === 'recording' ? engine.stopMic : engine.startMic}
                            label={micState === 'recording' ? 'Listening…' : micState === 'processing' ? 'Processing…' : 'Tap to speak'}
                        />
                        {!isWrite && (
                            <button
                                onClick={() => setTypeMode(true)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cream/40 hover:text-cream transition-colors duration-200"
                            >
                                <Keyboard className="h-3 w-3" />
                                Type instead
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={typed}
                            onChange={e => setTyped(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && typed.trim()) {
                                    engine.submitTyped(typed)
                                    setTyped('')
                                }
                            }}
                            placeholder={isWrite ? 'Write your response…' : 'Type your response…'}
                            className="flex-1 rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-violet-500 transition-all duration-200"
                            autoFocus
                        />
                        <button
                            onClick={() => {
                                if (typed.trim()) {
                                    engine.submitTyped(typed)
                                    setTyped('')
                                }
                            }}
                            disabled={!typed.trim()}
                            className="rounded-xl bg-violet-600 p-2.5 text-white disabled:opacity-40 transition-all duration-200 active:scale-95 hover:bg-violet-500"
                            aria-label="Send"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                        {!isWrite && (
                            <button
                                onClick={() => setTypeMode(false)}
                                className="text-[11px] text-cream/40 hover:text-cream"
                            >
                                Mic
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={engine.unsure}
                        className="text-[11px] font-bold text-cream/40 hover:text-cream transition-colors"
                    >
                        I'm not sure
                    </button>
                    {attempts > 0 && (
                        <span className="text-[11px] text-amber-400">
                            Attempt {attempts}/3
                        </span>
                    )}
                </div>

                {repairOpen && <RepairDock onRepair={engine.repairChoice} />}
            </div>
        )
    }

    return null
}
