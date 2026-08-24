'use client'

/**
 * InteractionDock — the learner's action surface.
 * Phase S3.4: fixed TS narrowing (speak vs unexpected) and RepairDock prop name.
 */
import { useState } from 'react'
import { Mic, Keyboard, Send, Volume2 } from 'lucide-react'
import type { SceneEngine } from '@/hooks/useSceneEngine'
import type { SceneOption } from '@/lib/sceneTypes'
import RepairDock from './RepairDock'

export default function InteractionDock({ engine, emphasize = false }: {
    engine: SceneEngine
    emphasize?: boolean
}) {
    const [typeMode, setTypeMode] = useState(false)
    const [typed, setTyped] = useState('')
    const { beat, micState, attempts, repairOpen, showHints, hintLevel } = engine

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

    // ── Listen stage ──
    if (beat.kind === 'listen') {
        return (
            <button
                onClick={() => engine.listenTap(beat.es)}
                className="group w-full rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-4 text-sm text-cream/80 transition-all duration-200 hover:border-glow/40 hover:bg-white/5 active:scale-[0.98]"
            >
                <span className="flex items-center justify-center gap-2">
                    <Volume2 className="h-4 w-4 text-glow" />
                    <span>{beat.es}</span>
                </span>
            </button>
        )
    }

    // ── Speak / unexpected stage (mic + typing fallback) ──
    if (beat.kind === 'speak' || beat.kind === 'unexpected') {
        // Safe narrowing: only `speak` carries prompt/hints.
        const prompt = beat.kind === 'speak'
            ? beat.prompt
            : 'Respond naturally — or ask for help.'
        const hints = beat.kind === 'speak' ? (beat.hints ?? []) : []
        const currentHint = showHints && hints.length > 0
            ? hints[Math.min(hintLevel, hints.length - 1)]
            : null

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

                {!typeMode ? (
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={micState === 'recording' ? engine.stopMic : engine.startMic}
                            className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                                emphasize
                                    ? 'h-20 w-20 bg-violet-600 text-white shadow-[0_0_40px_rgba(139,92,246,0.4)]'
                                    : 'h-14 w-14 bg-white/10 text-cream hover:bg-white/15'
                            } ${micState === 'recording' ? 'animate-pulse bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : ''} active:scale-95`}
                            aria-label={micState === 'recording' ? 'Stop recording' : 'Start recording'}
                        >
                            <Mic className={emphasize ? 'h-8 w-8' : 'h-5 w-5'} />
                        </button>
                        <p className="text-[11px] text-cream/40">
                            {micState === 'recording' ? 'Listening…' : 'Tap to speak'}
                        </p>
                        <button
                            onClick={() => setTypeMode(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cream/40 hover:text-cream transition-colors duration-200"
                        >
                            <Keyboard className="h-3 w-3" />
                            Type instead
                        </button>
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
                            placeholder="Type your response…"
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