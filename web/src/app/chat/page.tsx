'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Send } from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
    '¡Hola! ¿Cómo estás?',
    '¿Cómo se dice "thank you"?',
    'Háblame de tu día',
]

export default function ChatPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow() // gets the user's equipped glow palette
    
    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [thinking, setThinking] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, thinking])

    const send = async (text: string) => {
        const clean = text.trim()
        if (!clean || thinking) return
        setInput('')
        const next = [...messages, { role: 'user' as const, content: clean }]
        setMessages(next)
        setThinking(true)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
            })
            const data = await res.json()
            setMessages(m => [...m, { role: 'assistant', content: data.reply ?? '...' }])
        } catch (e) {
            console.error(e)
            setMessages(m => [...m, { role: 'assistant', content: '(Ecla lost the connection. Try again!)' }])
        } finally { setThinking(false) }
    }

    return (
        <main className="flex h-screen flex-col font-body">
            <NightBackground />

            <header className="z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <div className="flex items-center gap-2">
                        <Firefly mood={thinking ? 'thinking' : 'idle'} size={40} glow={glowColors} />
                        <div>
                            <h1 className="font-display text-lg font-bold text-cream leading-none">AI Tutor</h1>
                            <p className="text-[10px] font-semibold text-cream/50">Chat in Spanish</p>
                        </div>
                    </div>
                    <div className="w-20" />
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
                    {messages.length === 0 && !thinking && (
                        <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                                <Firefly mood="idle" size={120} glow={glowColors} />
                            </div>
                            <p className="text-cream/60 mb-6">Ecla is ready to chat. Try one of these:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {SUGGESTIONS.map(s => (
                                    <button key={s} onClick={() => send(s)} className="rounded-full border border-white/10 bg-night-800/60 px-4 py-2 text-sm font-semibold text-cream/70 hover:text-cream hover:border-white/25 transition-all">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-glow text-night-900 font-semibold rounded-br-md' : 'bg-night-800/80 border border-white/5 text-cream/90 rounded-bl-md'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {/* Spec: orbiting light-motes instead of a generic "..." */}
                    {thinking && (
                        <div className="flex justify-start items-end gap-2">
                            <Firefly mood="thinking" size={44} glow={glowColors} /> {/* <-- ADDED glow */}
                            <div className="rounded-2xl rounded-bl-md border border-white/5 bg-night-800/80 px-4 py-3 text-sm text-cream/50 italic">
                                Ecla is thinking…
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="z-40 backdrop-blur-md bg-night-950/70 border-t border-white/5">
                <div className="mx-auto max-w-3xl px-4 py-3 flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send(input)}
                        placeholder="Escribe en español…"
                        className="flex-1 rounded-xl border border-white/10 bg-night-800/70 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-glow transition-colors"
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
        </main>
    )
}