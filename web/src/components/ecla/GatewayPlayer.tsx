'use client'

/**
 * GatewayPlayer — The unbroken, hint-less UI (Phase 10).
 * 
 * No top nav. No "Lesson 4" chrome. No "Correct!" fireworks.
 * Just the setting, the transcript, and the microphone. 
 * The interface gets out of the way so the learner can function.
 */
import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Loader2, Send } from 'lucide-react'
import { useGatewayEngine } from '@/hooks/useGatewayEngine'
import { GATEWAY_SCENARIOS, GATEWAY_CONFIGS, type GatewayTurn } from '@/lib/gatewayTypes'
import { useMic } from '@/hooks/useMic' 

export default function GatewayPlayer({ getToken, onGraduate }: {
    getToken: () => Promise<string | null>
    onGraduate: (evidence: any[]) => void
}) {
    const engine = useGatewayEngine(getToken)
    const [typed, setTyped] = useState('')
    const logRef = useRef<HTMLDivElement>(null)

    // Reuse the Phase 7 mic hook for speech-to-text
    const mic = useMic(getToken, (text) => {
        engine.submit(text)
    })

    // Trigger graduation when the engine finishes the last scenario
    useEffect(() => {
        if (engine.session?.status === 'graduated') {
            onGraduate(engine.session.evidence)
        }
    }, [engine.session?.status, engine.session?.evidence, onGraduate])

    // Auto-scroll transcript
    useEffect(() => {
        logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [engine.history, engine.isThinking])

    // ── PRE-SIMULATION LOBBY ──
    if (!engine.session) {
        return (
            <div className="min-h-screen bg-[#0B0B10] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="font-display text-3xl font-bold text-cream mb-4">The Pre-A1 Gateway</h1>
                <p className="text-cream/60 max-w-md mb-2">
                    This is the final simulation. 
                </p>
                <p className="text-cream/40 max-w-md mb-8 text-sm">
                    No hints. No translations. No "Correct" or "Incorrect". 
                    Just you, the language, and the people of Madrid.
                </p>
                <button
                    onClick={engine.start}
                    className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition-colors"
                >
                    Begin Simulation
                </button>
            </div>
        )
    }

    const currentScenarioId = GATEWAY_SCENARIOS[engine.session.currentScenarioIndex]
    const config = GATEWAY_CONFIGS[currentScenarioId]

    // ── ACTIVE SIMULATION ──
    return (
        <div className="min-h-screen bg-[#0B0B10] flex flex-col">
            {/* Minimal Top Bar: Just the setting */}
            <header className="p-4 border-b border-white/5 flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-cream/40">{config.setting}</p>
                <p className="text-xs text-cream/40">
                    {engine.session.currentScenarioIndex + 1} / {GATEWAY_SCENARIOS.length}
                </p>
            </header>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-2xl mx-auto w-full">
                {engine.history.map((turn, i) => (
                    <TurnBubble key={i} turn={turn} />
                ))}
                
                {engine.isThinking && (
                    <div className="flex items-center gap-2 text-cream/40 text-sm pl-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}
                <div ref={logRef} />
            </div>

            {/* Input Area: Mic first, type second */}
            <div className="p-4 border-t border-white/5 bg-[#13131B]">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <button
                        onClick={mic.state === 'recording' ? mic.stop : mic.start}
                        disabled={engine.isThinking || mic.state === 'processing'}
                        className={`flex h-14 w-14 items-center justify-center rounded-full transition-all flex-shrink-0 ${
                            mic.state === 'recording' 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30'
                        }`}
                        aria-label={mic.state === 'recording' ? 'Stop recording' : 'Start speaking'}
                    >
                        {mic.state === 'recording' ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                    
                    <input
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && typed.trim()) {
                                engine.submit(typed)
                                setTyped('')
                            }
                        }}
                        placeholder={mic.state === 'recording' ? 'Listening...' : 'Type or speak...'}
                        disabled={engine.isThinking || mic.state === 'recording'}
                        className="flex-1 rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-3 text-sm text-cream focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    />
                    
                    <button
                        onClick={() => { if (typed.trim()) { engine.submit(typed); setTyped('') } }}
                        disabled={!typed.trim() || engine.isThinking}
                        className="h-14 w-14 flex items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-30 transition-opacity"
                        aria-label="Send message"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

/** Renders a single turn in the transcript */
function TurnBubble({ turn }: { turn: GatewayTurn }) {
    if (turn.role === 'ai') {
        return (
            <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3 text-cream/90">
                    {turn.text}
                </div>
            </div>
        )
    }
    if (turn.role === 'learner') {
        return (
            <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-3 text-white">
                    {turn.text}
                </div>
            </div>
        )
    }
    return null
}