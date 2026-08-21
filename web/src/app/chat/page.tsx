'use client'

/**
 * Chat Page: AI Tutor Conversational Interface
 * 
 * This page provides a conversational interface where students can practice Spanish
 * with Ecla, the AI tutor. It supports multiple interaction modes:
 * 
 * Features:
 * - Text-based chat with real-time AI responses
 * - Voice mode toggle: Ecla speaks her Spanish replies aloud
 * - Dictation: Record audio and transcribe to text via Whisper API
 * - Full-screen voice call: Hands-free conversation mode (separate component)
 * - Bilingual display: Spanish text with English subtitle translations
 * - Suggestion chips: Quick-start conversation starters
 * - Auto-scrolling: Keeps latest messages visible
 * - Typing indicator: Shows when Ecla is thinking
 * 
 * Architecture:
 * - Messages stored in local state (not persisted to DB)
 * - Chat history sent to backend on each message (last 10 messages)
 * - Voice mode preference persisted in localStorage
 * - EN: format parsing for bilingual display (Spanish main, English subtitle)
 * 
 * API Endpoints Used:
 * - POST /api/v1/chat: Send messages and get AI responses
 * - POST /api/v1/voice/transcribe: Transcribe recorded audio to text
 * 
 * State Management:
 * - messages: Array of conversation messages (user + assistant)
 * - input: Current text in the composer
 * - thinking: Whether AI is currently generating a response
 * - voiceMode: Whether to speak replies aloud (persisted to localStorage)
 * - recording: Whether microphone is currently recording
 * - speaking: Whether TTS is currently playing
 * - showCall: Whether full-screen voice call modal is open
 * 
 * The page renders immediately with an empty state - no loading screen needed
 * since it's a real-time interface, not a data-loading page.
 */

import { useEffect, useRef, useState, Suspense, KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, ArrowUp, Mic, Volume2, VolumeX, AudioLines } from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import VoiceCall, { type CallLine } from '@/components/VoiceCall'
import { speakSpanish, cancelSpeech } from '@/lib/speech'
import { useEquippedGlow } from '@/lib/useEquippedGlow'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Message structure for the chat history
 * role: 'user' for student messages, 'assistant' for Ecla's replies
 * content: The actual message text (may include EN: format for bilingual display)
 */
type Msg = { role: 'user' | 'assistant'; content: string }

/**
 * Conversation starter suggestions shown when chat is empty
 * These help students begin practicing immediately without thinking of what to say
 */
const SUGGESTIONS = [
    '¡Hola! ¿Cómo estás?',
    '¿Cómo se dice "thank you"?',
    'Háblame de tu día',
]

/**
 * Parses AI responses that use the EN: format for bilingual display
 * 
 * The backend returns messages in this format:
 * "Spanish text here
 * EN: English translation here"
 * 
 * This function splits them so we can display Spanish as the main message
 * and English as a smaller subtitle below it.
 * 
 * @param content - Raw message content from the API
 * @returns Object with spanish (main text) and english (subtitle, optional)
 */
function splitReply(content: string): { spanish: string; english?: string } {
    const [esPart, enPart] = content.split(/\n?EN:\s*/)
    return { spanish: esPart.trim(), english: enPart?.trim() || undefined }
}

/**
 * Main Chat Page Component
 * 
 * This component handles the entire conversational UI including:
 * - Message display with bilingual rendering
 * - Text input with auto-expanding textarea
 * - Voice mode toggle (speak replies aloud)
 * - Dictation via microphone (record → transcribe → send)
 * - Full-screen voice call integration
 * 
 * The page does NOT use a loading state because it's a real-time interface,
 * not a data-loading page. It renders immediately with an empty message list.
 */
function ChatPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    // ── Core State ──
    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [thinking, setThinking] = useState(false)
    
    // ── Voice & Audio State ──
    const [voiceMode, setVoiceMode] = useState(false)
    const [recording, setRecording] = useState(false)
    const [speaking, setSpeaking] = useState(false)
    const [showCall, setShowCall] = useState(false)

    // ── Refs for DOM elements and persistent state ──
    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const thinkingRef = useRef(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    /**
     * Initialize voice mode from localStorage and check for seed parameter
     * 
     * The seed parameter allows other pages to pre-fill the input with a
     * conversation starter (e.g., from a lesson's "Practice with Ecla" button)
     */
    useEffect(() => {
        setVoiceMode(localStorage.getItem('ecla-voice-mode') === 'on')
        const seed = searchParams.get('seed')
        if (seed) setInput(seed)
    }, [searchParams])

    /**
     * Auto-scroll to bottom when new messages arrive or thinking state changes
     * This keeps the latest conversation visible without manual scrolling
     */
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, thinking])

    /**
     * Auto-resize textarea based on content
     * 
     * The textarea expands vertically as the user types, up to a maximum of 120px.
     * This allows multi-line messages while keeping the composer compact.
     */
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }, [input])

    /**
     * TTS (Text-to-Speech) options for speaking messages aloud
     * These callbacks track whether Ecla is currently speaking
     */
    const speakOpts = {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
    }

    /**
     * Send a message to the AI and handle the response
     * 
     * Flow:
     * 1. Add user message to local state
     * 2. Set thinking state (shows typing indicator)
     * 3. Send full conversation history to backend (last 10 messages)
     * 4. Receive AI response
     * 5. Add response to message list
     * 6. If voice mode is on, speak the response aloud
     * 
     * @param text - The message text to send
     */
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
                    voice: voiceMode, // Backend uses different persona for voice mode
                }),
            })
            const data = await res.json()
            const reply = data.reply ?? '…'
            
            setMessages(m => [...m, { role: 'assistant', content: reply }])
            
            // Speak the reply if voice mode is enabled
            if (voiceMode) speakSpanish(reply, speakOpts)
        } catch (e) {
            console.error(e)
            setMessages(m => [...m, { role: 'assistant', content: '(Ecla lost the connection. Try again!)' }])
        } finally {
            setThinking(false)
            thinkingRef.current = false
        }
    }

    /**
     * Toggle voice mode on/off
     * 
     * Voice mode makes Ecla speak her Spanish replies aloud using the browser's
     * text-to-speech API. The preference is persisted to localStorage so it
     * survives page refreshes.
     */
    const toggleVoiceMode = () => {
        cancelSpeech()
        setSpeaking(false)
        setVoiceMode(v => {
            const newVal = !v
            localStorage.setItem('ecla-voice-mode', newVal ? 'on' : 'off')
            return newVal
        })
    }

    /**
     * Handle the end of a full-screen voice call
     * 
     * When the voice call modal closes, it passes back the conversation history.
     * We merge those messages into the main chat so the user can see the full
     * conversation without losing context.
     * 
     * @param callLines - Array of messages from the voice call
     */
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

    /**
     * Start recording audio for dictation
     * 
     * Flow:
     * 1. Request microphone access
     * 2. Create MediaRecorder instance
     * 3. Start recording
     * 4. When stopped, transcribe audio via Whisper API
     * 5. Either fill the input box (if AI is thinking) or send immediately
     * 
     * Important: We cancel any ongoing speech before recording to prevent
     * recording Ecla's voice instead of the user's voice.
     */
    const startRecording = async () => {
        if (thinkingRef.current) return
        cancelSpeech() // Don't record over Ecla's voice
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
                        // If AI is thinking, fill the input box so user can edit before sending
                        // Otherwise, send immediately
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

    /**
     * Stop recording and trigger transcription
     * The onstop handler in startRecording will handle the rest
     */
    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop()
            setRecording(false)
        }
    }

    /**
     * Handle keyboard shortcuts in the textarea
     * 
     * Enter (without Shift): Send the message
     * Shift+Enter: Insert a newline (for multi-line messages)
     */
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send(input)
        }
    }

    return (
        <main className="flex h-dvh flex-col font-body">
            <NightBackground />

            {/* ── Header ─ */}
            <header className="z-40 border-b border-white/5 bg-night-950/70 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-1.5 text-sm font-medium text-cream/50 transition-colors hover:text-cream"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <Firefly mood={speaking ? 'excited' : 'idle'} size={30} glow={glowColors} />
                        <span className="text-sm font-semibold text-cream">AI Tutor</span>
                    </div>

                    {/* Voice mode toggle button */}
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
            </header>

            {/* ── Messages Container ─ 
                 min-h-0 is critical for flex children to scroll properly on mobile
            */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
                    {messages.length === 0 && !thinking ? (
                        /* ── Empty State ─ */
                        <div className="flex flex-1 flex-col items-center justify-center gap-6">
                            <Firefly mood="idle" size={120} glow={glowColors} />
                            <div className="text-center">
                                <h2 className="font-display text-lg font-semibold text-cream">Ecla is ready</h2>
                                <p className="mt-1 text-sm text-cream/50">
                                    Type in Spanish or use the mic — she'll guide you.
                                </p>
                            </div>
                            {/* Conversation starter suggestions */}
                            <div className="flex flex-wrap justify-center gap-2">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="rounded-full border border-white/10 bg-night-800/60 px-4 py-2 text-xs font-medium text-cream/60 transition-colors hover:border-white/20 hover:text-cream"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* ── Message List ─ */
                        <div className="space-y-3">
                            {messages.map((m, i) => {
                                if (m.role === 'user') {
                                    /* ── User Message (right-aligned, gold background) ─ */
                                    return (
                                        <div key={i} className="flex justify-end">
                                            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-glow px-4 py-2.5 text-sm font-medium leading-relaxed text-night-900">
                                                {m.content}
                                            </div>
                                        </div>
                                    )
                                }
                                
                                /* ── Assistant Message (left-aligned, dark background) ─
                                   Parse EN: format to show Spanish main + English subtitle
                                */
                                const { spanish, english } = splitReply(m.content)
                                return (
                                    <div key={i} className="group flex items-center gap-1.5">
                                        <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/5 bg-night-800/80 px-4 py-2.5 text-sm leading-relaxed text-cream/90">
                                            {spanish}
                                            {english && (
                                                <p className="mt-1 text-[11px] italic leading-snug text-cream/45">{english}</p>
                                            )}
                                        </div>
                                        {/* Replay button: only visible on hover (desktop) */}
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

                            {/* ── Typing Indicator ─
                                 Three bouncing dots shown while AI is generating a response
                            */}
                            {thinking && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/5 bg-night-800/80 px-4 py-3">
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

            {/* ── Composer — ChatGPT-style pill ─
                 The primary button changes based on input state:
                 - Empty input: Waveform icon → opens voice call
                 - Has text: Arrow icon → sends message
            */}
            <div className="z-40 border-t border-white/5 bg-night-950/70 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
                <div className="mx-auto max-w-2xl px-4 py-3">
                    {/* Status indicator for recording or speaking */}
                    {(recording || speaking) && (
                        <p className={`mb-2 text-center text-[11px] font-medium ${recording ? 'text-coral' : 'text-glow'}`}>
                            {recording ? 'Listening… tap the mic to send' : 'Ecla is speaking…'}
                        </p>
                    )}

                    <div className="flex items-end gap-1 rounded-full border border-white/10 bg-night-800/80 p-2 shadow-lg shadow-black/30 transition-colors focus-within:border-glow/40">
                        {/* Auto-expanding textarea */}
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

                        {/* Microphone button for dictation */}
                        <button
                            onClick={recording ? stopRecording : startRecording}
                            disabled={thinking}
                            title={recording ? 'Stop and send' : 'Dictate'}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                                recording
                                    ? 'bg-coral/15 text-coral animate-pulse'
                                    : 'text-cream/50 hover:bg-white/5 hover:text-cream'
                            }`}
                        >
                            <Mic className="h-4 w-4" />
                        </button>

                        {/* Primary action button: Send or Voice Call */}
                        <button
                            onClick={() => (input.trim() ? send(input) : setShowCall(true))}
                            disabled={thinking && !!input.trim()}
                            title={input.trim() ? 'Send' : 'Voice mode — talk with Ecla'}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40 ${
                                input.trim()
                                    ? 'bg-glow text-night-900 hover:bg-glow-bright'
                                    : 'bg-glow/15 text-glow hover:bg-glow/25'
                            }`}
                        >
                            {input.trim() ? <ArrowUp className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Animations ─ */}
            <style>{`
                @keyframes ecla-bounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-3px); opacity: 1; }
                }
            `}</style>

            {/* ── Full-Screen Voice Call Modal ─ */}
            {showCall && <VoiceCall onEnd={handleCallEnd} />}
        </main>
    )
}

/**
 * Chat Page Export with Suspense Boundary
 * 
 * Next.js requires useSearchParams() to be wrapped in a Suspense boundary
 * during static generation. This wrapper provides a loading fallback
 * while the page content loads.
 */
export default function ChatPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-dvh items-center justify-center bg-night-950">
                    <Firefly mood="thinking" size={80} />
                </div>
            }
        >
            <ChatPageContent />
        </Suspense>
    )
}