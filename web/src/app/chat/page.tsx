'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Send, Volume2, VolumeX, AudioLines } from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import MicButton, { type MicStatus } from '@/components/MicButton'
import VoiceCall, { type CallLine } from '@/components/VoiceCall'
import { speakSpanish, cancelSpeech } from '@/lib/speech'
import { useEquippedGlow } from '@/lib/useEquippedGlow'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
    '¡Hola! ¿Cómo estás?',
    '¿Cómo se dice "thank you"?',
    'Háblame de tu día',
]

// Split reply into Spanish (spoken) + English (subtitle) when backend returns EN: format
function splitReply(content: string): { spanish: string; english?: string } {
    const [esPart, enPart] = content.split(/\n?EN:\s*/)
    return {
        spanish: esPart.trim(),
        english: enPart?.trim() || undefined,
    }
}

export default function ChatPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [thinking, setThinking] = useState(false)
    const [voiceMode, setVoiceMode] = useState(false)
    const [micStatus, setMicStatus] = useState<MicStatus>('idle')
    const [speaking, setSpeaking] = useState(false)
    const [showCall, setShowCall] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const thinkingRef = useRef(false)

    useEffect(() => {
        setVoiceMode(localStorage.getItem('ecla-voice-mode') === 'on')
        const seed = searchParams.get('seed')
        if (seed) setInput(seed)
    }, [searchParams])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, thinking])

    const speakOpts = {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false)
    }

    const send = async (text: string) => {
        const clean = text.trim()
        if (!clean || thinkingRef.current) return
        setInput('')
        cancelSpeech()
        setSpeaking(false)
        const next = [...messages, { role: 'user' as const, content: clean }]
        setMessages(next)
        setThinking(true)
        thinkingRef.current = true
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    messages: next.map(m => ({ role: m.role, content: m.content })),
                    voice: voiceMode,
                }),
            })
            const data = await res.json()
            const reply = data.reply ?? '...'
            setMessages(m => [...m, { role: 'assistant', content: reply }])
            if (voiceMode) speakSpanish(reply, speakOpts)
        } catch (e) {
            console.error(e)
            setMessages(m => [...m, { role: 'assistant', content: '(Ecla lost the connection. Try again!)' }])
        } finally {
            setThinking(false)
            thinkingRef.current = false
        }
    }

    const toggleVoiceMode = () => {
        cancelSpeech()
        setSpeaking(false)
        setVoiceMode(v => {
            const newVal = !v
            localStorage.setItem('ecla-voice-mode', newVal ? 'on' : 'off')
            return newVal
        })
    }

    const handleCallEnd = (callLines: CallLine[]) => {
        setShowCall(false)
        if (callLines.length) {
            setMessages(m => [
                ...m,
                ...callLines.map(l => ({
                    role: (l.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: l.text,
                }))
            ])
        }
    }

    return (
        <main className="flex h-screen flex-col font-body">
            <NightBackground />

            <header className="z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <div className="flex items-center gap-2">
                        <Firefly
                            mood={thinking ? 'thinking' : speaking ? 'excited' : 'idle'}
                            size={40}
                            glow={glowColors}
                        />
                        <div>
                            <h1 className="font-display text-lg font-bold text-cream leading-none">AI Tutor</h1>
                            <p className="text-[10px] font-semibold text-cream/50">Chat in Spanish</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCall(true)}
                            title="Voice mode — talk with Ecla hands-free"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-glow/40 bg-glow/10 text-glow hover:bg-glow/20 transition-all"
                        >
                            <AudioLines className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleVoiceMode}
                            title={voiceMode ? 'Voice mode ON — Ecla speaks her Spanish' : 'Voice mode OFF — tap to enable'}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${voiceMode
                                    ? 'border-glow/40 bg-glow/10 text-glow shadow-[0_0_16px_rgba(255,200,87,0.25)]'
                                    : 'border-white/10 bg-night-800/60 text-cream/40 hover:text-cream'
                                }`}
                        >
                            {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
                    {messages.length === 0 && !thinking && (
                        <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                                <Firefly mood="idle" size={120} glow={glowColors} />
                            </div>
                            <p className="text-cream/60 mb-2">Ecla is ready to chat. Type — or tap the mic and speak.</p>
                            {voiceMode && (
                                <p className="text-[11px] text-glow/80 font-semibold mb-4 flex items-center justify-center gap-1.5">
                                    <Volume2 className="w-3 h-3" /> Voice mode on — she'll answer out loud.
                                </p>
                            )}
                            <div className="flex flex-wrap justify-center gap-2">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="rounded-full border border-white/10 bg-night-800/60 px-4 py-2 text-sm font-semibold text-cream/70 hover:text-cream hover:border-white/25 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => {
                        if (m.role === 'user') {
                            return (
                                <div key={i} className="flex justify-end">
                                    <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-glow text-night-900 font-semibold rounded-br-md">
                                        {m.content}
                                    </div>
                                </div>
                            )
                        }

                        const { spanish, english } = splitReply(m.content)
                        return (
                            <div key={i} className="flex justify-start">
                                <div className="flex items-end gap-1.5 max-w-[85%]">
                                    <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-night-800/80 border border-white/5 text-cream/90 rounded-bl-md">
                                        {spanish}
                                        {english && (
                                            <span className="block mt-1 text-[11px] text-cream/50 italic">{english}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => speakSpanish(m.content, speakOpts)}
                                        title="Hear the Spanish"
                                        className="p-1.5 text-cream/30 hover:text-glow transition-colors flex-shrink-0"
                                    >
                                        <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}

                    {thinking && (
                        <div className="flex justify-start items-end gap-2">
                            <Firefly mood="thinking" size={44} glow={glowColors} />
                            <div className="rounded-2xl rounded-bl-md border border-white/5 bg-night-800/80 px-4 py-3 text-sm text-cream/50 italic">
                                Ecla is thinking…
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="z-40 backdrop-blur-md bg-night-950/70 border-t border-white/5">
                {(micStatus !== 'idle' || speaking) && (
                    <div className="mx-auto max-w-3xl px-4 pt-2">
                        {micStatus === 'listening' && (
                            <p className="text-[11px] font-semibold text-coral flex items-center gap-1.5 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-coral" /> Listening… tap the mic when you're done
                            </p>
                        )}
                        {micStatus === 'processing' && (
                            <p className="text-[11px] font-semibold text-drill">Transcribing your Spanish…</p>
                        )}
                        {speaking && micStatus === 'idle' && (
                            <p className="text-[11px] font-semibold text-glow flex items-center gap-1.5">
                                <Volume2 className="w-3 h-3" /> Ecla is speaking — toggle 🔊 off to stop
                            </p>
                        )}
                    </div>
                )}
                <div className="mx-auto max-w-3xl px-4 py-3 flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send(input)}
                        placeholder={micStatus === 'listening' ? 'Listening…' : 'Escribe en español…'}
                        className="flex-1 rounded-xl border border-white/10 bg-night-800/70 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-glow transition-colors"
                    />
                    <MicButton
                        onTranscript={(t) => (thinkingRef.current ? setInput(t) : send(t))}
                        onStatus={setMicStatus}
                        disabled={thinking}
                    />
                    <button
                        onClick={() => send(input)}
                        disabled={!input.trim() || thinking}
                        className="rounded-xl bg-glow px-4 py-3 text-night-900 hover:bg-glow-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showCall && <VoiceCall onEnd={handleCallEnd} />}
        </main>
    )
}