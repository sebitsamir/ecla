'use client'

import { authFetch } from '@/lib/apiClient'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@clerk/nextjs'
import { PhoneOff, Loader2, AudioLines, Volume2 } from 'lucide-react'
import { speak, cancelSpeech } from '@/lib/speech'
import { useHandsFreeVoice } from '@/lib/useHandsFreeVoice'

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
        const res = await authFetch(`/api/v1/chat`, getToken, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        let raw = '', full = '', speakBuf = '', streamError = ''

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
                    const { delta, error } = JSON.parse(payload)
                    if (typeof error === 'string') { streamError = error; continue }
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
        
        if (streamError) throw new Error(streamError)
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
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') return
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
            } catch (e: unknown) {
                setError(e instanceof Error && e.message === 'unsupported'
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
        <div className="fixed inset-0 z-[60] flex h-dvh min-w-0 flex-col overflow-hidden bg-obsidian font-body text-ivory">
            <Image src="/worlds/spanish-cafe-scene-v1.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
            <div aria-hidden className="absolute inset-0 bg-obsidian/38" />
            <div aria-hidden className={`absolute inset-0 transition-colors duration-500 ${listening ? 'bg-black/5' : phase === 'thinking' ? 'bg-black/30' : 'bg-transparent'}`} />
            <style>{`
                @keyframes vc-bar { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
                .vc-bar { width: 3px; height: 16px; border-radius: 2px; animation: vc-bar .9s ease-in-out infinite; }
                @keyframes vc-ring { 0% { transform: scale(.85); opacity: .6 } 100% { transform: scale(1.45); opacity: 0 } }
                .vc-ring { animation: vc-ring 2.4s ease-out infinite; }
                .vc-scroll { scrollbar-width: none; }
                .vc-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            <header className="safe-top relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-ember-soft"><span className="size-1.5 rounded-full bg-success" />Live conversation</p>
                    <h1 className="mt-1 truncate text-sm font-medium text-ivory">Spanish with Ecla</h1>
                </div>
                <button
                    onClick={() => onEnd(linesRef.current)}
                    className="ecla-control flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-black/35 px-4 text-xs font-semibold text-ivory backdrop-blur-md hover:border-danger-soft/50 hover:text-danger-soft"
                >
                    <PhoneOff className="size-4" />
                    <span>End</span>
                </button>
            </header>

            <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-end">
                <div className="flex flex-col items-center px-4 pb-4 sm:pb-6">
                    <button onClick={interrupt} disabled={phase === 'error'} aria-label={phase === 'ecla' || phase === 'thinking' ? 'Interrupt Ecla and speak' : status} className="ecla-control relative flex size-20 items-center justify-center rounded-full border border-white/25 bg-black/45 text-ivory shadow-[0_0_60px_rgba(230,162,60,.22)] backdrop-blur-md sm:size-24">
                    {(listening || phase === 'ecla') && (
                        <>
                                <span className={`vc-ring pointer-events-none absolute inset-0 rounded-full border ${ringTone}`} />
                                <span className={`vc-ring pointer-events-none absolute inset-0 rounded-full border ${ringTone}`} style={{ animationDelay: '1.2s' }} />
                        </>
                    )}
                        {phase === 'thinking' || state === 'processing' ? <Loader2 className="size-7 animate-spin text-ember-soft" /> : phase === 'ecla' ? <Volume2 className="size-7 text-ember-soft" /> : <AudioLines className="size-7" />}
                    </button>

                    <div className="mt-3 flex min-h-10 items-center gap-2.5 rounded-full border border-white/15 bg-black/50 px-4 backdrop-blur-md" role="status">
                    <span className="text-xs font-medium text-ivory">{status}</span>
                    {state === 'hearing' && <Bars tone="coral" />}
                    {phase === 'ecla' && <Bars tone="glow" />}
                </div>

                <div
                    ref={scrollRef}
                        className="vc-scroll mt-4 flex max-h-[32dvh] w-full max-w-xl flex-col gap-2 overflow-y-auto rounded-surface border border-white/10 bg-black/40 p-3 backdrop-blur-md sm:max-h-[28dvh] sm:p-4"
                >
                    {lines.map((l, i) => (
                        l.text ? (
                            <div key={i} className={`flex ${l.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[88%] break-words rounded-surface px-3.5 py-2 text-sm leading-6 ${
                                    l.role === 'user'
                                            ? 'rounded-br-sm bg-ember font-medium text-obsidian'
                                            : 'rounded-bl-sm border border-line bg-carbon/90 text-ivory'
                                }`}>
                                    {l.text}
                                </div>
                            </div>
                        ) : null
                    ))}
                    
                    {/* live words */}
                    {listening && liveText && (
                        <div className="flex justify-end">
                                <div className="flex max-w-[88%] items-end gap-2 break-words rounded-surface rounded-br-sm bg-ember px-3.5 py-2 text-sm font-medium leading-6 text-obsidian">
                                <span>{liveText}</span>
                                    <span className="mb-1 size-1.5 shrink-0 animate-pulse rounded-full bg-obsidian/60" />
                            </div>
                        </div>
                    )}
                </div>
                    <p className="mt-3 text-center text-[10px] leading-4 text-ivory/55">
                        {phase === 'ecla' || phase === 'thinking' ? 'Tap the voice control to interrupt.' : 'Speak naturally. Ecla will respond when you pause.'}
                    </p>
                    <p className="safe-bottom mt-1 pb-2 text-center text-[9px] leading-4 text-ivory/40">Voice mode uses your browser’s speech recognition. Ecla receives the resulting transcript.</p>
            </div>
            </main>
        </div>
    )
}
