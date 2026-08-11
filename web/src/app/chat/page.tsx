'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Loader2, Send, Bot, Sparkles } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Message = { role: 'user' | 'assistant'; content: string }

const suggestedPrompts = [
    '¡Hola! ¿Cómo estás?',
    'Help me order a coffee',
    'Quiz me on ser vs estar',
]

export default function ChatPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const send = async (text?: string) => {
        const content = (text ?? input).trim()
        if (!content || loading) return
        setInput('')

        const newMessages: Message[] = [...messages, { role: 'user', content }]
        setMessages(newMessages)
        setLoading(true)

        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ messages: newMessages.slice(-12) }),
            })
            if (!res.ok) throw new Error('Chat request failed')
            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        } catch (e) {
            console.error(e)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please try again.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
            <header className="p-4 md:p-6 border-b border-zinc-800 flex items-center gap-4">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-zinc-800 rounded-lg transition">
                    <ArrowLeft className="w-6 h-6 text-zinc-400" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Bot className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="font-bold">AI Tutor</h1>
                        <p className="text-xs text-zinc-500">Adapts to your level & goal</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
                {messages.length === 0 && (
                    <div className="text-center pt-16">
                        <div className="inline-flex p-4 rounded-full bg-emerald-500/10 mb-4">
                            <Sparkles className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Practice with your AI tutor</h2>
                        <p className="text-zinc-400 mb-8 text-sm">It knows your level and why you're learning.</p>
                        <div className="flex flex-col gap-2 max-w-xs mx-auto">
                            {suggestedPrompts.map(p => (
                                <button
                                    key={p}
                                    onClick={() => send(p)}
                                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-sm text-zinc-300 transition"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-sm'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                                }`}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm">
                            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-zinc-800 max-w-2xl mx-auto w-full">
                <div className="flex gap-3">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        placeholder="Escribe en español..."
                        className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-emerald-500 transition text-sm"
                    />
                    <button
                        onClick={() => send()}
                        disabled={!input.trim() || loading}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl transition"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </main>
    )
}