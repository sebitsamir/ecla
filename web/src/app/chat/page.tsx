'use client'

import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowUp, AudioLines, Mic, Volume2, VolumeX } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import ApiState from '@/components/ApiState'
import VoiceCall, { type CallLine } from '@/components/VoiceCall'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useStoredPreference } from '@/hooks/useStoredPreference'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { speakSpanish, cancelSpeech } from '@/lib/speech'

type Msg = { role: 'user' | 'assistant'; content: string }
type ChatContext = { currentCompetency?: { canDo: string }; weakDimensions?: string[] }

const SUGGESTIONS = [
    '¡Hola! ¿Cómo estás?',
    '¿Cómo se dice “thank you”?',
    'Háblame de tu día',
]

function splitReply(content: string): { spanish: string; english?: string } {
    const [esPart, enPart] = content.split(/\n?EN:\s/)
    return { spanish: esPart.trim(), english: enPart?.trim() || undefined }
}

function ChatPageContent() {
    const searchParams = useSearchParams()
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState(searchParams.get('seed') ?? '')
    const [thinking, setThinking] = useState(false)
    const [chatContext, setChatContext] = useState<ChatContext | null>(null)
    const [sendError, setSendError] = useState<ApiError | null>(null)
    const [voiceError, setVoiceError] = useState<string | null>(null)
    const [voicePreference, setVoicePreference] = useStoredPreference('ecla-voice-mode', 'off')
    const voiceMode = voicePreference === 'on'
    const [recording, setRecording] = useState(false)
    const [speaking, setSpeaking] = useState(false)
    const [showCall, setShowCall] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const thinkingRef = useRef(false)
    const activeRef = useRef(true)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])

    useEffect(() => {
        activeRef.current = true
        return () => {
            activeRef.current = false
            cancelSpeech()
            mediaStreamRef.current?.getTracks().forEach(track => track.stop())
        }
    }, [])

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return
        let cancelled = false
        apiFetch<{ context?: ChatContext }>('/api/v1/learner/chat-context', getToken)
            .then(data => { if (!cancelled) setChatContext(data.context ?? null) })
            .catch(() => { /* Context improves focus but does not block conversation. */ })
        return () => { cancelled = true }
    }, [getToken, isLoaded, isSignedIn])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, thinking])

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }, [input])

    const speakOpts = {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
    }

    const send = async (text: string) => {
        const clean = text.trim()
        if (!clean || thinkingRef.current || !isSignedIn) return
        const previous = messages
        const next = [...previous, { role: 'user' as const, content: clean }]
        setInput('')
        setSendError(null)
        cancelSpeech()
        setSpeaking(false)
        setMessages(next)
        setThinking(true)
        thinkingRef.current = true
        try {
            const data = await apiFetch<{ reply?: string }>('/api/v1/chat', getToken, {
                method: 'POST',
                body: JSON.stringify({
                    messages: next.map(message => ({ role: message.role, content: message.content })),
                    voice: voiceMode,
                }),
            })
            if (typeof data.reply !== 'string' || !data.reply.trim()) throw new ApiError('server', 'Ecla returned an empty response.')
            const reply = data.reply.trim()
            setMessages(current => [...current, { role: 'assistant', content: reply }])
            if (voiceMode) speakSpanish(reply, speakOpts)
        } catch (reason) {
            setMessages(previous)
            setInput(clean)
            setSendError(reason instanceof ApiError ? reason : new ApiError('network', 'Ecla lost the connection.'))
        } finally {
            setThinking(false)
            thinkingRef.current = false
        }
    }

    const toggleVoiceReplies = () => {
        cancelSpeech()
        setSpeaking(false)
        setVoicePreference(voiceMode ? 'off' : 'on')
    }

    const handleCallEnd = (callLines: CallLine[]) => {
        setShowCall(false)
        if (callLines.length) {
            setMessages(current => [
                ...current,
                ...callLines.map(line => ({
                    role: (line.role === 'user' ? 'user' : 'assistant') as Msg['role'],
                    content: line.text,
                })),
            ])
        }
    }

    const startRecording = async () => {
        if (thinkingRef.current) return
        setVoiceError(null)
        cancelSpeech()
        setSpeaking(false)
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setVoiceError('Voice dictation is not supported in this browser. You can keep typing.')
            return
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaStreamRef.current = stream
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) chunksRef.current.push(event.data)
            }
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop())
                mediaStreamRef.current = null
                if (!activeRef.current) return
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
                if (!blob.size) {
                    setVoiceError('No speech was captured. Try again or type your message.')
                    return
                }
                try {
                    const data = await apiFetch<{ text?: string }>('/api/v1/voice/transcribe', getToken, {
                        method: 'POST',
                        headers: { 'Content-Type': blob.type },
                        body: blob,
                    })
                    const transcript = data.text?.trim()
                    if (transcript) await send(transcript)
                    else setVoiceError('No words were recognized. Try again or type your message.')
                } catch (reason) {
                    setVoiceError(reason instanceof ApiError ? reason.message : 'Voice transcription is unavailable. You can keep typing.')
                }
            }
            mediaRecorder.start()
            setRecording(true)
        } catch {
            setVoiceError('Microphone access is unavailable. Allow access or keep typing.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
        setRecording(false)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send(input)
        }
    }

    if (!isLoaded) {
        return <AppShell><div className="flex min-h-[60vh] items-center justify-center" role="status"><div className="text-center"><span className="ecla-loading-mark mx-auto block text-ember-soft" /><p className="font-display mt-5 text-2xl text-ivory">Preparing the conversation…</p></div></div></AppShell>
    }

    if (!isSignedIn) {
        return <AppShell><div className="mx-auto max-w-2xl py-16"><ApiState error={new ApiError('unauthorized', 'Your session needs to be renewed.', 401)} /></div></AppShell>
    }

    return (
        <AppShell>
            <section className="mx-auto flex h-[calc(100dvh-9.5rem)] min-h-[28rem] min-w-0 max-w-4xl flex-col overflow-hidden rounded-[22px] border border-line bg-ink shadow-glow-md sm:rounded-experience xl:h-[calc(100dvh-8rem)] xl:max-h-[52rem]">
                <header className="flex min-w-0 items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
                    <div className="min-w-0"><h1 className="truncate text-sm font-semibold text-ivory">Ecla conversation</h1><p className="mt-0.5 truncate text-xs text-ash">Spanish · adapts to your current level</p></div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button onClick={toggleVoiceReplies} aria-pressed={voiceMode} aria-label={voiceMode ? 'Turn voice replies off' : 'Turn voice replies on'} className={`ecla-control flex min-h-11 items-center gap-2 rounded-control border px-3 text-xs ${voiceMode ? 'border-ember/30 bg-ember/10 text-ember-soft' : 'border-line bg-surface text-stone hover:text-ivory'}`}>
                            {voiceMode ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}<span className="hidden sm:inline">Voice replies</span>
                        </button>
                    </div>
                </header>

                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-3 py-3 sm:px-6 sm:py-6">
                        {messages.length === 0 && !thinking ? (
                            <div className="flex min-h-full items-center justify-center py-8 sm:py-12">
                                <div className="w-full max-w-xl text-center">
                                    <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-ember/30 bg-ember/10 text-ember-soft"><AudioLines className="size-6" /></span>
                                    <h2 className="font-display mt-5 text-3xl leading-tight text-ivory sm:text-4xl">What would you like to say?</h2>
                                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone">{chatContext?.currentCompetency ? chatContext.currentCompetency.canDo : 'Speak naturally, ask a question, or practice a short Spanish exchange.'}</p>
                                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                                        {SUGGESTIONS.map(suggestion => <button key={suggestion} onClick={() => send(suggestion)} className="ecla-control min-h-11 rounded-full border border-line-strong bg-white/[.03] px-4 text-sm text-stone hover:border-ember/35 hover:text-ivory">{suggestion}</button>)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-auto space-y-4" aria-live="polite">
                                {messages.map((message, index) => {
                                    if (message.role === 'user') return <div key={index} className="flex justify-end"><div className="max-w-[88%] break-words rounded-surface rounded-br-sm bg-ember px-4 py-3 text-sm font-medium leading-6 text-obsidian sm:max-w-[75%]">{message.content}</div></div>
                                    const { spanish, english } = splitReply(message.content)
                                    return <div key={index} className="group flex min-w-0 items-end gap-2"><div className="max-w-[88%] break-words rounded-surface rounded-bl-sm border border-line bg-carbon px-4 py-3 text-sm leading-6 text-ivory sm:max-w-[75%]"><p lang="es">{spanish}</p>{english ? <p className="mt-2 border-t border-line pt-2 text-xs leading-5 text-stone">{english}</p> : null}</div><button onClick={() => { cancelSpeech(); speakSpanish(message.content, speakOpts) }} aria-label="Hear this reply" className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full text-ash hover:bg-white/[.05] hover:text-ember-soft"><Volume2 className="size-4" /></button></div>
                                })}
                                {thinking ? <div className="flex justify-start"><div className="flex items-center gap-2 rounded-surface rounded-bl-sm border border-line bg-carbon px-4 py-3" role="status" aria-label="Ecla is thinking"><span className="ecla-loading-mark text-ember-soft" /><span className="text-xs text-stone">Ecla is listening to the meaning…</span></div></div> : null}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="border-t border-line bg-obsidian/85 px-3 py-3 backdrop-blur-xl sm:px-5">
                    <div className="mx-auto max-w-3xl">
                        {sendError ? <div className="mb-2"><ApiState error={sendError} onRetry={() => send(input)} /></div> : null}
                        {voiceError ? <p role="status" className="mb-2 rounded-control border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-ivory">{voiceError}</p> : null}
                        {(recording || speaking) ? <p className={`mb-2 text-center text-xs ${recording ? 'text-danger-soft' : 'text-ember-soft'}`}>{recording ? 'Listening… tap Stop when you are finished.' : 'Ecla is speaking…'}</p> : null}
                        <div className="flex min-w-0 items-end gap-1.5 rounded-surface border border-line-strong bg-carbon p-1.5 focus-within:border-ember/45">
                            <textarea ref={textareaRef} value={input} onChange={event => { setInput(event.target.value); setSendError(null) }} onKeyDown={handleKeyDown} placeholder="Say something in Spanish…" aria-label="Message Ecla" rows={1} enterKeyHint="send" maxLength={2000} className="max-h-[120px] min-h-11 min-w-0 flex-1 resize-none self-center bg-transparent px-3 py-2 text-sm leading-6 text-ivory placeholder:text-ash focus:outline-none" />
                            <button onClick={recording ? stopRecording : startRecording} disabled={thinking} aria-label={recording ? 'Stop recording and transcribe' : 'Dictate a message'} className={`ecla-control flex size-11 shrink-0 items-center justify-center rounded-full ${recording ? 'animate-mic-pulse bg-danger text-ivory' : 'text-stone hover:bg-white/[.05] hover:text-ivory'}`}>{recording ? <span className="size-3 rounded-sm bg-current" /> : <Mic className="size-4" />}</button>
                            {input.trim() ? (
                                <button onClick={() => send(input)} disabled={thinking} aria-label="Send message" className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full bg-ember text-obsidian hover:bg-ember-soft"><ArrowUp className="size-4" /></button>
                            ) : (
                                <button onClick={() => setShowCall(true)} disabled={thinking || recording} aria-label="Start a live voice conversation" className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full bg-ember text-obsidian hover:bg-ember-soft"><AudioLines className="size-4" /></button>
                            )}
                        </div>
                        <p className="mt-2 text-center text-[11px] leading-4 text-ash">Enter to send · Shift + Enter for a new line</p>
                    </div>
                </footer>

                {showCall ? <VoiceCall onEnd={handleCallEnd} /> : null}
            </section>
        </AppShell>
    )
}

export default function ChatPage() {
    return <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-obsidian text-stone" role="status">Preparing the conversation…</div>}><ChatPageContent /></Suspense>
}
