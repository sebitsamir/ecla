'use client'

/**
 * MissionRunner — voice-first AI role-play (Phase 6)
 *
 * Fixes in this version:
 * - Score card never renders blank (fallback "—" when score missing)
 * - Infra/evaluation failure NEVER fails the learner: shows a neutral
 *   "recorded" state instead of "Good attempt!" + X (Constitution: errors
 *   are data, not punishment)
 * - Feedback line only renders when non-empty
 */

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Mic, Loader2, X, Target, MessageCircle, Keyboard, CheckCircle2, XCircle, RefreshCcw, AlertTriangle } from 'lucide-react'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { speakSpanish, cancelSpeech } from '@/lib/speech'
import { useMic } from '@/hooks/useMic'
import MicButton from '@/components/ecla/MicButton'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const REPAIR_MARKERS = ['no entiendo', 'puedes repetir', 'despacio', 'significa', 'otra vez']

type Turn = { role: 'ai' | 'learner'; text: string }

export default function MissionRunner({ competencyId, onClose }: { competencyId: string; onClose: () => void }) {
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    const [mission, setMission] = useState<any>(null)
    const [missing, setMissing] = useState(false)
    const [phase, setPhase] = useState<'intro' | 'ai' | 'learner' | 'processing' | 'evaluating' | 'result'>('intro')
    const [history, setHistory] = useState<Turn[]>([])
    const [heard, setHeard] = useState<string | null>(null)
    const [repairCount, setRepairCount] = useState(0)
    const [result, setResult] = useState<any>(null)
    const [typeMode, setTypeMode] = useState(false)
    const [typed, setTyped] = useState('')

    const learnerTurnRef = useRef<(text: string) => void>(() => {})
    const mic = useMic(getToken, text => learnerTurnRef.current(text))

    useEffect(() => {
        async function load() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/missions/${competencyId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) setMission((await res.json()).mission)
                else setMissing(true)
            } catch { setMissing(true) }
        }
        load()
        return () => cancelSpeech()
    }, [competencyId, getToken])

    /** AI partner speaks, then hands the mic to the learner */
    const aiSay = async (prevHistory: Turn[]) => {
        setPhase('ai')
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/missions/${competencyId}/turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ history: prevHistory }),
            })
            const { text } = await res.json()
            const next = [...prevHistory, { role: 'ai' as const, text: text ?? 'Hola.' }]
            setHistory(next)
            speakSpanish(text ?? 'Hola.', {
                onStart: () => setPhase('ai'),
                onEnd: () => setPhase('learner'),
            })
        } catch {
            setPhase('learner')
        }
    }

    const start = () => aiSay([])

    /** Learner turn → detect repair → AI responds */
    const learnerTurn = async (text: string) => {
        if (!text.trim()) return
        const clean = text.trim()
        if (REPAIR_MARKERS.some(m => clean.toLowerCase().includes(m))) setRepairCount(c => c + 1)
        const next = [...history, { role: 'learner' as const, text: clean }]
        setHistory(next)
        setHeard(null)
        setTyped('')
        aiSay(next)
    }

    learnerTurnRef.current = learnerTurn

    const startRecording = () => {
        cancelSpeech()
        if (mic.error) setTypeMode(true)
        else mic.start()
    }

    const stopRecording = () => mic.stop()

    useEffect(() => {
        if (mic.state === 'processing') setPhase('processing')
        else if (phase === 'processing' && mic.state === 'idle') setPhase('learner')
    }, [mic.state, phase])

    /** End mission → FUNCTION evaluation */
    const finish = async () => {
        cancelSpeech()
        setPhase('evaluating')
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/missions/${competencyId}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ transcript: history }),
            })
            if (!res.ok) throw new Error('evaluate failed')
            setResult(await res.json())
        } catch {
            // Infra failure → neutral "recorded" state, never a fail
            setResult({ passed: null, score: null, feedback: '', evalError: true })
        }
        setPhase('result')
    }

    const learnerTurns = history.filter(t => t.role === 'learner').length

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-night-950/95 backdrop-blur-md font-body">
            {/* Header */}
            <div className="mx-auto w-full max-w-2xl px-4 h-14 flex items-center justify-between">
                <p className="text-sm font-bold text-cream/70 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-400" /> Mission
                </p>
                <button onClick={() => { cancelSpeech(); onClose() }} className="rounded-lg p-2 text-cream/60 hover:text-cream">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

                    {/* ── INTRO ── */}
                    {phase === 'intro' && mission && (
                        <div className="rounded-2xl border border-purple-400/30 bg-night-800/80 p-6 text-center space-y-4">
                            <Firefly mood="proud" size={90} glow={glowColors} />
                            <h2 className="font-display text-xl font-bold text-cream">{mission.title}</h2>
                            <p className="text-sm text-cream/70 italic">"{mission.scenario}"</p>
                            <p className="text-xs text-cream/50">
                                A Spanish speaker will talk to you. Respond with your voice.
                                You can ask them to repeat — that's a skill, not a failure.
                            </p>
                            <button onClick={start} className="w-full py-3.5 rounded-xl bg-purple-400 text-night-900 font-bold flex items-center justify-center gap-2">
                                <Mic className="h-4 w-4" /> Start Mission
                            </button>
                        </div>
                    )}

                    {phase === 'intro' && missing && (
                        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-6 text-center space-y-4">
                            <Firefly mood="dim" size={80} glow={glowColors} />
                            <p className="text-sm text-cream/70">No mission for this competency yet — finish the part or retry after seeding missions.</p>
                            <button onClick={onClose} className="w-full py-3 rounded-xl border border-white/10 text-cream/70 text-sm">Go back</button>
                        </div>
                    )}

                    {/* ── CONVERSATION ── */}
                    {(phase === 'ai' || phase === 'learner' || phase === 'processing') && (
                        <>
                            <div className="space-y-2">
                                {history.map((t, i) => (
                                    <div key={i} className={`flex ${t.role === 'learner' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${t.role === 'learner' ? 'bg-glow text-night-900 font-semibold' : 'bg-night-800/80 text-cream/90 border border-white/5'}`}>
                                            {t.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-night-800/70 p-5 text-center space-y-3">
                                {phase === 'ai' && <p className="text-sm text-cream/60 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Your partner is speaking…</p>}
                                {phase === 'processing' && <p className="text-sm text-cream/60 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking what you said…</p>}
                                {phase === 'learner' && !typeMode && (
                                    <>
                                        <MicButton
                                            state={mic.state}
                                            size="lg"
                                            onTap={mic.state === 'recording' ? stopRecording : startRecording}
                                            label={mic.state === 'recording' ? 'Listening… tap to finish' : 'Your turn — tap and speak'}
                                        />
                                        {mic.error && (
                                            <p className="text-xs text-amber-400">
                                                {mic.error === 'denied' ? 'Microphone blocked.' : 'Voice unavailable.'}
                                            </p>
                                        )}
                                        <button onClick={() => setTypeMode(true)} className="text-[11px] text-cream/40 flex items-center gap-1 mx-auto">
                                            <Keyboard className="h-3 w-3" /> Prefer typing?
                                        </button>
                                    </>
                                )}
                                {phase === 'learner' && typeMode && (
                                    <div className="flex gap-2">
                                        <input
                                            value={typed} onChange={e => setTyped(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && learnerTurn(typed)}
                                            placeholder="Type your Spanish…"
                                            className="flex-1 p-3 rounded-xl border border-white/10 bg-night-900/60 text-cream text-sm focus:outline-none focus:border-glow"
                                        />
                                        <button onClick={() => learnerTurn(typed)} disabled={!typed.trim()} className="px-4 rounded-xl bg-glow text-night-900 font-bold disabled:opacity-40">Send</button>
                                    </div>
                                )}
                            </div>

                            {learnerTurns >= 2 && (
                                <button onClick={finish} className="w-full py-3 rounded-xl border border-white/10 text-cream/70 text-sm font-semibold hover:bg-night-800">
                                    Finish Mission
                                </button>
                            )}
                        </>
                    )}

                    {/* ── EVALUATING ── */}
                    {phase === 'evaluating' && (
                        <div className="text-center py-12">
                            <Firefly mood="thinking" size={90} glow={glowColors} />
                            <p className="text-sm text-cream/60 mt-4">Evaluating your communication…</p>
                        </div>
                    )}

                    {/* ── RESULT (evidence card) ── */}
                    {phase === 'result' && result && (
                        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-6 text-center space-y-4">
                            {result.evalError
                                ? <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
                                : result.passed
                                    ? <CheckCircle2 className="h-12 w-12 text-leaf mx-auto" />
                                    : <XCircle className="h-12 w-12 text-coral mx-auto" />}

                            <h2 className="font-display text-xl font-bold text-cream">
                                {result.evalError ? 'Attempt recorded' : result.passed ? 'Mission accomplished!' : 'Good attempt!'}
                            </h2>

                            {result.feedback ? <p className="text-sm text-cream/70">{result.feedback}</p> : null}
                            {result.evalError && (
                                <p className="text-xs text-cream/50">
                                    Evaluation was unavailable — your conversation was saved and will count as practice, not a fail.
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl bg-night-900/60 p-3">
                                    <p className="text-lg font-bold text-glow">{result.score ?? '—'}</p>
                                    <p className="text-[10px] text-cream/50">Score</p>
                                </div>
                                <div className="rounded-xl bg-night-900/60 p-3">
                                    <p className="text-lg font-bold text-cream">{learnerTurns}</p>
                                    <p className="text-[10px] text-cream/50">Your turns</p>
                                </div>
                                <div className="rounded-xl bg-night-900/60 p-3">
                                    <p className="text-lg font-bold text-purple-400">{repairCount}</p>
                                    <p className="text-[10px] text-cream/50">Repairs</p>
                                </div>
                            </div>

                            {repairCount > 0 && (
                                <p className="text-[11px] text-cream/50">
                                    You repaired the conversation {repairCount}× — that's a real survival skill. 💪
                                </p>
                            )}

                            <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-glow text-night-900 font-bold flex items-center justify-center gap-2">
                                <MessageCircle className="h-4 w-4" /> Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}