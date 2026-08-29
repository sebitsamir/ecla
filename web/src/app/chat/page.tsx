'use client'

import { API_URL } from '@/lib/apiClient'

/**
 * /chat — AI tutor conversational interface (premium pass).
 * Text-based chat with voice mode toggle, dictation, bilingual display,
 * suggestion chips, auto-scrolling, typing indicator.
 */
import { useEffect, useRef, useState, Suspense, KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, ArrowUp, Mic, Volume2, VolumeX, AudioLines } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import VoiceCall, { type CallLine } from '@/components/VoiceCall'
import { speakSpanish, cancelSpeech } from '@/lib/speech'


type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
    '¡Hola! ¿Cómo estás?',
    '¿Cómo se dice "thank you"?',
    'Háblame de tu día',
]

function splitReply(content: string): { spanish: string; english?: string } {
    const [esPart, enPart] = content.split(/\n?EN:\s/)
    return { spanish: esPart.trim(), english: enPart?.trim() || undefined }
}

function ChatPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()

    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [thinking, setThinking] = useState(false)
    const [chatContext, setChatContext] = useState<{ currentCompetency?: { canDo: string }; weakDimensions?: string[] } | null>(null)
    const [voiceMode, setVoiceMode] = useState(false)
    const [recording, setRecording] = useState(false)
    const [speaking, setSpeaking] = useState(false)
    const [showCall, setShowCall] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const thinkingRef = useRef(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    useEffect(() => {
        setVoiceMode(localStorage.getItem('ecla-voice-mode') === 'on')
        const seed = searchParams.get('seed')
        if (seed) setInput(seed)
        ;(async () => {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/learner/chat-context`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setChatContext(data.context)
                }
            } catch { /* non-blocking */ }
        })()
    }, [searchParams, getToken])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, thinking])

    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }, [input])

    const speakOpts = {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
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
            const reply = data.reply ?? '…'
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
                })),
            ])
        }
    }

    const startRecording = async () => {
        if (thinkingRef.current) return
        cancelSpeech()
        setSpeaking(false)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                stream.getTracks().forEach(t => t.stop())
                try {
                    const token = await getToken()
                    const res = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type },
                        body: blob,
                    })
                    const data = await res.json()
                    if (data.text?.trim()) {
                        if (thinkingRef.current) setInput(data.text.trim())
                        else send(data.text.trim())
                    }
                } catch (e) {
                    console.error('Transcription failed:', e)
                }
            }
            mediaRecorder.start()
            setRecording(true)
        } catch (e) {
            console.error('Mic access denied:', e)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop()
            setRecording(false)
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send(input)
        }
    }

    return (
        <AppShell>
            <div className="flex h-[calc(100vh-3.5rem)] flex-col">
                <div className="border-b border-white/5 bg-[#0B0B10]/90 backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-cream">AI Tutor</span>
                        </div>
                        <button
                            onClick={toggleVoiceMode}
                            title={voiceMode ? 'Voice replies on' : 'Voice replies off'}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                                voiceMode ? 'text-glow' : 'text-cream/50 hover:bg-white/5 hover:text-cream'
                            }`}
                        >
                            {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
                        {messages.length === 0 && !thinking ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-6">
                                <div className="text-center">
                                    <h2 className="font-display text-lg font-semibold text-cream">Practice in context</h2>
                                    <p className="mt-1 text-sm text-cream/50">
                                        {chatContext?.currentCompetency
                                            ? `Focused on: ${chatContext.currentCompetency.canDo}`
                                            : 'Conversation stays inside your current competency.'}
                                    </p>
                                    {chatContext?.weakDimensions?.length ? (
                                        <p className="mt-2 text-xs text-glow">
                                            Practicing: {chatContext.weakDimensions.join(', ')}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {SUGGESTIONS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="rounded-full border border-white/10 bg-[#13131B] px-4 py-2 text-xs font-medium text-cream/60 transition-colors hover:border-white/20 hover:text-cream active:scale-[0.98]"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((m, i) => {
                                    if (m.role === 'user') {
                                        return (
                                            <div key={i} className="flex justify-end">
                                                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-glow px-4 py-2.5 text-sm font-medium leading-relaxed text-night-900">
                                                    {m.content}
                                                </div>
                                            </div>
                                        )
                                    }
                                    const { spanish, english } = splitReply(m.content)
                                    return (
                                        <div key={i} className="group flex items-center gap-1.5">
                                            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/5 bg-[#13131B] px-4 py-2.5 text-sm leading-relaxed text-cream/90">
                                                {spanish}
                                                {english && (
                                                    <p className="mt-1 text-[11px] italic leading-snug text-cream/45">{english}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => { cancelSpeech(); speakSpanish(m.content, speakOpts) }}
                                                title="Hear it"
                                                className="text-cream/25 transition-opacity hover:text-glow sm:opacity-0 sm:group-hover:opacity-100"
                                            >
                                                <Volume2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )
                                })}
                                {thinking && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/5 bg-[#13131B] px-4 py-3">
                                            {[0, 1, 2].map(i => (
                                                <span
                                                    key={i}
                                                    className="h-1.5 w-1.5 rounded-full bg-cream/40"
                                                    style={{ animation: 'ecla-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 150}ms` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-white/5 bg-[#0B0B10]/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
                    <div className="mx-auto max-w-2xl px-4 py-3">
                        {(recording || speaking) && (
                            <p className={`mb-2 text-center text-[11px] font-medium ${recording ? 'text-coral' : 'text-glow'}`}>
                                {recording ? 'Listening… tap the mic to send' : 'Ecla is speaking…'}
                            </p>
                        )}
                        <div className="flex items-end gap-1 rounded-full border border-white/10 bg-[#13131B] p-2 transition-colors focus-within:border-glow/40">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Ecla anything…"
                                rows={1}
                                enterKeyHint="send"
                                className="max-h-[120px] flex-1 resize-none self-center bg-transparent px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none"
                            />
                            <button
                                onClick={recording ? stopRecording : startRecording}
                                disabled={thinking}
                                title={recording ? 'Stop and send' : 'Dictate'}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 active:scale-[0.98] ${
                                    recording
                                        ? 'bg-coral/15 text-coral animate-pulse'
                                        : 'text-cream/50 hover:bg-white/5 hover:text-cream'
                                }`}
                            >
                                <Mic className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => (input.trim() ? send(input) : setShowCall(true))}
                                disabled={thinking && !!input.trim()}
                                title={input.trim() ? 'Send' : 'Voice mode — talk with Ecla'}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40 active:scale-[0.98] ${
                                    input.trim()
                                        ? 'bg-glow text-night-900 hover:bg-glow/90'
                                        : 'bg-glow/15 text-glow hover:bg-glow/25'
                                }`}
                            >
                                {input.trim() ? <ArrowUp className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes ecla-bounce {
                        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                        30% { transform: translateY(-3px); opacity: 1; }
                    }
                `}</style>

                {showCall && <VoiceCall onEnd={handleCallEnd} />}
            </div>
        </AppShell>
    )
}

export default function ChatPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[#0B0B10]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-glow border-t-transparent" />
                </div>
            }
        >
            <ChatPageContent />
        </Suspense>
    )
}