'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { PhoneOff, Loader2, AudioLines, Volume2 } from 'lucide-react'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { speak, cancelSpeech } from '@/lib/speech'
import { useHandsFreeVoice } from '@/lib/useHandsFreeVoice'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const GREETING = '¡Hola! Soy Ecla. ¿Cómo estás hoy?'

export type CallLine = { role: 'user' | 'assistant'; text: string }

// Live equalizer bars — visual proof of sound
function Bars({ tone }: { tone: 'coral' | 'glow' }) {
    return (
        <div className="flex h-4 items-center gap-[3px]" aria-hidden="true">
            {[0, 1, 2, 3, 4].map(i => (
                <span
                    key={i}
                    className={`vc-bar ${tone === 'coral' ? 'bg-coral' : 'bg-glow'}`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                />
            ))}
        </div>
    )
}

export default function VoiceCall({ onEnd }: { onEnd: (lines: CallLine[]) => void }) {
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    const [phase, setPhase] = useState<'boot' | 'user' | 'ecla' | 'thinking' | 'error'>('boot')
    const [lines, setLines] = useState<CallLine[]>([])
    const [error, setError] = useState<string | null>(null)

    const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
    const linesRef = useRef<CallLine[]>([])
    const endedRef = useRef(false)
    const micOpenRef = useRef(false)
    const lastSpokenRef = useRef('')
    const scrollRef = useRef<HTMLDivElement>(null)

    const queueRef = useRef<string[]>([])
    const pumpingRef = useRef(false)
    const streamDoneRef = useRef(false)
    const abortRef = useRef<AbortController | null>(null)

    const pushLine = (line: CallLine) => {
        linesRef.current = [...linesRef.current, line]
        setLines(linesRef.current)
    }

    const updateLastAssistant = (text: string) => {
        const arr = linesRef.current
        const last = arr[arr.length - 1]
        if (last?.role === 'assistant') {
            last.text = text
            setLines([...arr])
        }
    }

    const { state, liveText, startCall, listen, endCall } = useHandsFreeVoice(onUtterance)

    // Auto-scroll transcript to the newest line
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [lines, liveText])

    const norm = (s: string) => s.toLowerCase().replace(/[^a-záéíóúñü]+/gi, ' ').trim()

    function isEcho(transcript: string): boolean {
        const a = norm(transcript).split(' ').filter(Boolean)
        const b = norm(lastSpokenRef.current).split(' ').filter(Boolean)
        if (a.length < 3 || b.length < 3) return false
        const setB = new Set(b)
        const hit = a.filter(w => setB.has(w)).length
        return hit / Math.min(a.length, b.length) > 0.7
    }

    const rememberSpoken = (s: string[]) => {
        lastSpokenRef.current = (lastSpokenRef.current + ' ' + s.join(' ')).slice(-400)
    }

    function handToUser() {
        if (endedRef.current || micOpenRef.current) return
        micOpenRef.current = true
        setPhase('user')
        listen()
    }

    function pumpQueue() {
        if (pumpingRef.current) return
        const next = queueRef.current.shift()
        if (next == null) {
            if (streamDoneRef.current) handToUser()
            return
        }
        pumpingRef.current = true
        setPhase('ecla')
        speak(next, 'es-ES', {
            onEnd: () => {
                pumpingRef.current = false
                pumpQueue()
            }
        })
    }

    function enqueue(sentences: string[]) {
        rememberSpoken(sentences)
        queueRef.current.push(...sentences)
        pumpQueue()
    }

    function resetTurn() {
        queueRef.current = []
        pumpingRef.current = false
        streamDoneRef.current = false
        abortRef.current?.abort()
        abortRef.current = new AbortController()
    }

    async function streamReply(): Promise<string> {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: historyRef.current.slice(-10),
                voice: true,
                stream: true
            }),
            signal: abortRef.current?.signal,
        })

        if (!res.ok || !res.body) throw new Error('bad response')

        pushLine({ role: 'assistant', text: '' })
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = '', full = '', speakBuf = ''

        for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            raw += decoder.decode(value, { stream: true })
            const sseLines = raw.split('\n')
            raw = sseLines.pop() ?? ''
            
            for (const line of sseLines) {
                const t = line.trim()
                if (!t.startsWith('data:')) continue
                const payload = t.slice(5).trim()
                if (payload === '[DONE]') continue
                
                try {
                    const { delta } = JSON.parse(payload)
                    if (!delta) continue
                    full += delta
                    speakBuf += delta
                    updateLastAssistant(full)
                    
                    const complete = speakBuf.match(/[^.!?¿¡]+[.!?¿¡]+/g)
                    if (complete) {
                        speakBuf = speakBuf.slice(complete.join('').length)
                        enqueue(complete.map(s => s.trim()).filter(Boolean))
                    }
                } catch {
                    /* partial SSE line */
                }
            }
        }
        
        if (speakBuf.trim()) enqueue([speakBuf.trim()])
        if (!full) throw new Error('empty stream')
        return full
    }

    async function onUtterance(text: string) {
        if (endedRef.current) return
        if (isEcho(text)) {
            handToUser()
            return
        }

        micOpenRef.current = false
        pushLine({ role: 'user', text })
        historyRef.current.push({ role: 'user', content: text })
        setPhase('thinking')
        resetTurn()
        
        try {
            const full = await streamReply()
            historyRef.current.push({ role: 'assistant', content: full })
            streamDoneRef.current = true
            pumpQueue()
        } catch (e: any) {
            if (e?.name === 'AbortError') return
            pushLine({ role: 'assistant', text: '(connection lost — just speak again)' })
            streamDoneRef.current = true
            pumpQueue()
        }
    }

    useEffect(() => {
        endedRef.current = false
        micOpenRef.current = false
        let cancelled = false
        
        ;(async () => {
            try {
                await startCall()
                if (cancelled) return
                rememberSpoken([GREETING])
                pushLine({ role: 'assistant', text: GREETING })
                historyRef.current.push({ role: 'assistant', content: GREETING })
                setPhase('ecla')
                speak(GREETING, 'es-ES', {
                    onEnd: () => {
                        if (!cancelled) handToUser()
                    }
                })
            } catch (e: any) {
                setError(e?.message === 'unsupported'
                    ? 'Voice mode needs Chrome or Edge on this device.'
                    : 'Microphone blocked — allow mic access to use voice mode.')
                setPhase('error')
            }
        })()
        
        return () => {
            cancelled = true
            endedRef.current = true
            abortRef.current?.abort()
            cancelSpeech()
            endCall()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const interrupt = () => {
        if (phase === 'ecla' || phase === 'thinking') {
            abortRef.current?.abort()
            cancelSpeech()
            queueRef.current = []
            pumpingRef.current = false
            streamDoneRef.current = true
            handToUser()
        }
    }

    const listening = state === 'waiting' || state === 'hearing'
    const ringTone = phase === 'ecla' ? 'border-glow/50' : 'border-coral/50'

    const status =
        phase === 'error' ? error ?? 'Something went wrong' :
        phase === 'thinking' ? 'Thinking…' :
        phase === 'ecla' ? 'Ecla is speaking' :
        state === 'hearing' ? 'Hearing you…' :
        state === 'processing' ? 'Got it — sending…' :
        'Listening'

    return (
        <div className="fixed inset-0 z-[60] flex h-dvh flex-col bg-night-950/95 backdrop-blur-md font-body">
            <style>{`
                @keyframes vc-bar { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
                .vc-bar { width: 3px; height: 16px; border-radius: 2px; animation: vc-bar .9s ease-in-out infinite; }
                @keyframes vc-ring { 0% { transform: scale(.85); opacity: .6 } 100% { transform: scale(1.45); opacity: 0 } }
                .vc-ring { animation: vc-ring 2.4s ease-out infinite; }
                .vc-scroll { scrollbar-width: none; }
                .vc-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Header */}
            <div className="z-10 mx-auto w-full max-w-3xl px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" />
                    <p className="text-sm font-bold text-cream/80">Voice mode · Spanish</p>
                </div>
                <button
                    onClick={() => onEnd(linesRef.current)}
                    className="flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-4 py-1.5 text-xs font-bold text-coral hover:bg-coral/20 transition-all"
                >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End</span>
                </button>
            </div>

            {/* Stage */}
            <div className="flex flex-col items-center justify-center gap-5 py-4">
                <div className="relative flex items-center justify-center">
                    <div className="absolute h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,200,87,0.08), transparent 65%)' }} />
                    {(listening || phase === 'ecla') && (
                        <>
                            <span className={`vc-ring absolute h-52 w-52 rounded-full border-2 ${ringTone}`} />
                            <span className={`vc-ring absolute h-52 w-52 rounded-full border-2 ${ringTone}`} style={{ animationDelay: '1.2s' }} />
                        </>
                    )}
                    <button
                        onClick={interrupt}
                        title={phase === 'ecla' ? 'Interrupt' : undefined}
                        className="relative"
                    >
                        <Firefly
                            mood={phase === 'thinking' ? 'thinking' : phase === 'ecla' ? 'excited' : 'idle'}
                            size={170}
                            glow={glowColors}
                        />
                    </button>
                </div>

                {/* Status pill */}
                <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-night-800/70 px-4 py-2">
                    {phase === 'thinking' || state === 'processing' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cream/60" />
                    ) : phase === 'ecla' ? (
                        <Volume2 className="w-3.5 h-3.5 text-glow" />
                    ) : (
                        <AudioLines className="w-3.5 h-3.5 text-coral" />
                    )}
                    <span className="text-xs font-bold text-cream/70">{status}</span>
                    {state === 'hearing' && <Bars tone="coral" />}
                    {phase === 'ecla' && <Bars tone="glow" />}
                </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 min-h-0 px-6 pb-3">
                <div
                    ref={scrollRef}
                    className="vc-scroll mx-auto flex h-full max-w-lg flex-col gap-2 overflow-y-auto pr-1"
                >
                    {lines.map((l, i) => (
                        l.text ? (
                            <div key={i} className={`flex ${l.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                    l.role === 'user'
                                        ? 'rounded-br-md bg-glow font-semibold text-night-900'
                                        : 'rounded-bl-md bg-night-800/80 text-cream/90 border border-white/5'
                                }`}>
                                    {l.text}
                                </div>
                            </div>
                        ) : null
                    ))}
                    
                    {/* live words */}
                    {listening && liveText && (
                        <div className="flex justify-end">
                            <div className="flex max-w-[85%] items-end gap-2 rounded-2xl rounded-br-md bg-glow px-3.5 py-2 text-sm font-semibold text-night-900">
                                <span>{liveText}</span>
                                <span className="mb-1 h-1.5 w-1.5 animate-pulse rounded-full bg-night-900/60" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ─ */}
            <div className="pb-6 pt-2 flex justify-center">
                <p className="text-[11px] text-cream/40 font-semibold">
                    Just talk — tap Ecla to interrupt
                </p>
            </div>
        </div>
    )
}