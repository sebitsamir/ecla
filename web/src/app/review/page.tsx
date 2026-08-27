'use client'

/**
 * /review — Spaced repetition flashcard system (premium pass).
 * SM-2 algorithm: Again (0), Hard (3), Good (4), Easy (5).
 * Features: instant-tap grading, sequential save queue, keyboard shortcuts,
 * session stats. Zero noise — just the card and the grades.
 */
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Card = { id: string; word: string; translation: string; progress: any }

export default function ReviewPage() {
    const router = useRouter()
    const { getToken } = useAuth()

    const [queue, setQueue] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [flipped, setFlipped] = useState(false)
    const [stats, setStats] = useState({ reviewed: 0, good: 0, agains: 0 })

    const tokenRef = useRef<string | null>(null)
    const saveChain = useRef<Promise<void>>(Promise.resolve())
    const lastPointer = useRef(0)

    useEffect(() => { fetchDue() }, [getToken])

    async function fetchDue() {
        try {
            if (!tokenRef.current) tokenRef.current = await getToken()
            const res = await fetch(`${API_URL}/api/v1/flashcards/due`, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            })
            const data = await res.json()
            setQueue(data.cards || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    const card = queue[0]
    const finished = !loading && !card

    const enqueueSave = (vocabId: string, quality: number) => {
        saveChain.current = saveChain.current.then(async () => {
            try {
                if (!tokenRef.current) tokenRef.current = await getToken()
                const res = await fetch(`${API_URL}/api/v1/flashcards/review`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenRef.current}`
                    },
                    body: JSON.stringify({ vocabId, quality }),
                })
                if (res.status === 401) {
                    tokenRef.current = await getToken()
                    await fetch(`${API_URL}/api/v1/flashcards/review`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${tokenRef.current}`
                        },
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
        setFlipped(false)
        enqueueSave(current.id, quality)
    }

    const flip = () => setFlipped(true)

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
            if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault()
                flip()
            } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
                grade([0, 3, 4, 5][Number(e.key) - 1])
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [flipped, loading, finished, queue])

    return (
        <AppShell>
            <div className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-10">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-48 sm:h-64 rounded-2xl bg-white/5" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(i => <div key={i} className="h-16 sm:h-20 rounded-xl bg-white/5" />)}
                        </div>
                    </div>
                ) : finished ? (
                    <div className="text-center py-8 sm:py-16">
                        {stats.reviewed === 0 ? (
                            <>
                                <h2 className="font-display text-xl sm:text-2xl font-bold text-cream mb-2">All caught up!</h2>
                                <p className="text-cream/60 text-sm sm:text-base mb-6 sm:mb-8">No cards due right now.</p>
                                <button
                                    onClick={() => router.push('/course')}
                                    className="w-full py-3 sm:py-3.5 rounded-xl bg-glow font-bold text-night-900 hover:bg-glow/90 active:scale-[0.98] transition-all text-sm sm:text-base"
                                >
                                    Back to the Path
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="font-display text-xl sm:text-2xl font-bold text-cream mb-2">Session complete!</h2>
                                <p className="text-cream/60 text-sm sm:text-base mb-6 sm:mb-8">
                                    {stats.reviewed} reviews · {stats.good} stuck well · {stats.agains} to relearn
                                </p>
                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        onClick={() => {
                                            setStats({ reviewed: 0, good: 0, agains: 0 })
                                            setFlipped(false)
                                            setLoading(true)
                                            fetchDue()
                                        }}
                                        className="flex-1 py-3 sm:py-3.5 rounded-xl border border-white/10 bg-[#13131B] font-semibold text-cream hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Again
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="flex-1 py-3 sm:py-3.5 rounded-xl bg-glow font-bold text-night-900 hover:bg-glow/90 active:scale-[0.98] transition-all text-sm sm:text-base"
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            key={card.id}
                            {...(!flipped ? instant(flip) : {})}
                            className={`w-full rounded-2xl border p-6 sm:p-8 md:p-10 text-center transition-all ${
                                flipped
                                    ? 'border-violet-500/40 bg-[#13131B]'
                                    : 'border-white/10 bg-[#13131B] hover:border-white/20 active:bg-[#171722]'
                            }`}
                        >
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mb-3 sm:mb-4">
                                {flipped ? 'Translation' : 'Tap to reveal'}
                            </p>
                            {flipped ? (
                                <div>
                                    <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-cream mb-2">{card.translation}</p>
                                    <p className="text-cream/50 text-xs sm:text-sm">{card.word}</p>
                                </div>
                            ) : (
                                <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-cream">{card.word}</p>
                            )}
                        </button>

                        {flipped ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 sm:mt-6">
                                <button
                                    {...instant(() => grade(0))}
                                    className="py-3 sm:py-3.5 rounded-xl border border-coral/30 bg-coral/5 text-coral font-bold text-xs sm:text-sm hover:bg-coral/10 active:scale-[0.98] transition-all"
                                >
                                    Again
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">1</span>
                                </button>
                                <button
                                    {...instant(() => grade(3))}
                                    className="py-3 sm:py-3.5 rounded-xl border border-glow/30 bg-glow/5 text-glow font-bold text-xs sm:text-sm hover:bg-glow/10 active:scale-[0.98] transition-all"
                                >
                                    Hard
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">2</span>
                                </button>
                                <button
                                    {...instant(() => grade(4))}
                                    className="py-3 sm:py-3.5 rounded-xl border border-leaf/30 bg-leaf/5 text-leaf font-bold text-xs sm:text-sm hover:bg-leaf/10 active:scale-[0.98] transition-all"
                                >
                                    Good
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">3</span>
                                </button>
                                <button
                                    {...instant(() => grade(5))}
                                    className="py-3 sm:py-3.5 rounded-xl border border-violet-500/30 bg-violet-600/5 text-violet-300 font-bold text-xs sm:text-sm hover:bg-violet-600/10 active:scale-[0.98] transition-all"
                                >
                                    Easy
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">4</span>
                                </button>
                            </div>
                        ) : (
                            <p className="text-center text-xs text-cream/40 mt-4 sm:mt-6">
                                Think of the answer, then tap the card (or press Space)
                            </p>
                        )}

                        <div className="mt-6 sm:mt-8 text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-cream/40">
                                {queue.length} left
                            </p>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    )
}