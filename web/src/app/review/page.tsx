'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Card = { id: string; word: string; translation: string; progress: any }

export default function ReviewPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow() // gets the user's equipped glow palette

    const [queue, setQueue] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [flipped, setFlipped] = useState(false)
    const [stats, setStats] = useState({ reviewed: 0, good: 0, agains: 0 })
    const [mood, setMood] = useState<'idle' | 'proud' | 'dim'>('idle')

    /* Perf refs: one cached token + a sequential save queue (no connection storm) */
    const tokenRef = useRef<string | null>(null)
    const saveChain = useRef<Promise<void>>(Promise.resolve())
    const lastPointer = useRef(0)

    useEffect(() => { fetchDue() }, [getToken])

    async function fetchDue() {
        try {
            if (!tokenRef.current) tokenRef.current = await getToken()
            const res = await fetch(`${API_URL}/api/v1/flashcards/due`, { headers: { Authorization: `Bearer ${tokenRef.current}` } })
            const data = await res.json()
            setQueue(data.cards || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    const card = queue[0]
    const finished = !loading && !card

    /* Saves run ONE AT A TIME in the background — never block the UI, never storm */
    const enqueueSave = (vocabId: string, quality: number) => {
        saveChain.current = saveChain.current.then(async () => {
            try {
                if (!tokenRef.current) tokenRef.current = await getToken()
                const res = await fetch(`${API_URL}/api/v1/flashcards/review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
                    body: JSON.stringify({ vocabId, quality }),
                })
                if (res.status === 401) { // token expired mid-session → refresh once, retry
                    tokenRef.current = await getToken()
                    await fetch(`${API_URL}/api/v1/flashcards/review`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
                        body: JSON.stringify({ vocabId, quality }),
                    })
                }
            } catch (e) { console.error('review save failed', e) }
        })
    }

    const grade = (quality: number) => {
        if (!card) return
        const current = card
        setQueue(q => {
            const rest = q.slice(1)
            return quality === 0 ? [...rest, current] : rest
        })
        setStats(s => ({
            reviewed: s.reviewed + 1,
            good: s.good + (quality >= 3 ? 1 : 0),
            agains: s.agains + (quality === 0 ? 1 : 0),
        }))
        setMood(quality >= 4 ? 'proud' : quality === 3 ? 'idle' : 'dim')
        setFlipped(false)
        enqueueSave(current.id, quality)
    }

    const flip = () => setFlipped(true)

    /* Instant-tap: act on pointer-DOWN (zero tap latency), click only as keyboard fallback */
    const instant = (fn: () => void) => ({
        onPointerDown: (e: React.PointerEvent) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            lastPointer.current = Date.now()
            fn()
        },
        onClick: () => {
            if (Date.now() - lastPointer.current > 400) fn()
        },
    })

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (loading || finished) return
            if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip() }
            else if (flipped && ['1', '2', '3', '4'].includes(e.key)) grade([0, 3, 4, 5][Number(e.key) - 1])
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [flipped, loading, finished, queue])

    return (
        <main className="min-h-screen font-body">
            <style>{`
                @keyframes flip-in { from { opacity: .3; } to { opacity: 1; } }
                .flip-in { animation: flip-in .12s ease-out; }
            `}</style>
            <NightBackground />

            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                    <h1 className="font-display text-xl font-bold text-cream">Review</h1>
                    <span className="text-xs font-bold text-cream/50">{queue.length} left</span>
                </div>
            </header>

            <div className="mx-auto max-w-md px-4 py-10">
                {loading ? (
                    <div className="flex justify-center py-24"><Firefly mood="thinking" size={120} glow={glowColors} /></div>
                ) : finished ? (
                    stats.reviewed === 0 ? (
                        <div className="text-center py-16">
                            <div className="flex justify-center mb-6"><Firefly mood="proud" size={140} glow={glowColors} /></div>
                            <h2 className="font-display text-2xl font-bold text-cream mb-2">All caught up!</h2>
                            <p className="text-cream/60 mb-8">No cards due right now. Ecla is glowing happily.</p>
                            <button onClick={() => router.push('/course')} className="w-full py-3.5 rounded-xl bg-glow font-bold text-night-900 hover:bg-glow-bright transition-colors">
                                Back to the Path
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="flex justify-center mb-6"><Firefly mood="proud" size={140} glow={glowColors} /></div>
                            <h2 className="font-display text-2xl font-bold text-cream mb-2">Session complete!</h2>
                            <p className="text-cream/60 mb-8">
                                {stats.reviewed} reviews · {stats.good} stuck well · {stats.agains} to relearn
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => { setStats({ reviewed: 0, good: 0, agains: 0 }); setFlipped(false); setLoading(true); fetchDue(); }} className="flex-1 py-3.5 rounded-xl border border-white/10 bg-night-800/60 font-semibold text-cream hover:bg-night-800 transition-colors flex items-center justify-center gap-2">
                                    <RotateCcw className="w-4 h-4" /> Again
                                </button>
                                <button onClick={() => router.push('/dashboard')} className="flex-1 py-3.5 rounded-xl bg-glow font-bold text-night-900 hover:bg-glow-bright transition-colors">
                                    Done
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <>
                        {/* Flashcard — solid bg, NO backdrop-blur (blur = mobile jank) */}
                        <button
                            key={card.id}
                            {...(!flipped ? instant(flip) : {})}
                            className={`w-full rounded-card border p-8 md:p-10 text-center shadow-glow-sm flip-in ${flipped ? 'border-immersion/40 bg-night-800' : 'border-white/10 bg-night-800 hover:border-white/25'}`}
                        >
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-4">{flipped ? 'Translation' : 'Tap to reveal'}</p>
                            {flipped ? (
                                <div>
                                    <p className="font-display text-3xl md:text-4xl font-bold text-cream mb-2">{card.translation}</p>
                                    <p className="text-cream/50 text-sm">{card.word}</p>
                                </div>
                            ) : (
                                <p className="font-display text-3xl md:text-4xl font-bold text-cream">{card.word}</p>
                            )}
                        </button>

                        {/* Grading — fires on pointer-DOWN, instant */}
                        {flipped ? (
                            <div className="grid grid-cols-4 gap-2 mt-6 flip-in">
                                <button {...instant(() => grade(0))} className="py-3 rounded-xl border-2 border-coral/50 bg-coral/10 text-coral font-bold text-sm hover:bg-coral/20">
                                    Again <span className="block text-[10px] opacity-60 font-semibold mt-0.5">1</span>
                                </button>
                                <button {...instant(() => grade(3))} className="py-3 rounded-xl border-2 border-glow/50 bg-glow/10 text-glow font-bold text-sm hover:bg-glow/20">
                                    Hard <span className="block text-[10px] opacity-60 font-semibold mt-0.5">2</span>
                                </button>
                                <button {...instant(() => grade(4))} className="py-3 rounded-xl border-2 border-leaf/50 bg-leaf/10 text-leaf font-bold text-sm hover:bg-leaf/20">
                                    Good <span className="block text-[10px] opacity-60 font-semibold mt-0.5">3</span>
                                </button>
                                <button {...instant(() => grade(5))} className="py-3 rounded-xl border-2 border-drill/50 bg-drill/10 text-drill font-bold text-sm hover:bg-drill/20">
                                    Easy <span className="block text-[10px] opacity-60 font-semibold mt-0.5">4</span>
                                </button>
                            </div>
                        ) : (
                            <p className="text-center text-xs text-cream/40 mt-6">
                                Think of the answer, then tap the card (or press Space)
                            </p>
                        )}

                        <div className="flex justify-center mt-8 pointer-events-none">
                            <Firefly mood={mood} size={72} glow={glowColors} />
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}