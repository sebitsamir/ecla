'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Loader2, RotateCcw, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Card = {
    id: string
    word: string
    translation: string
}

export default function ReviewPage() {
    const router = useRouter()
    const { getToken } = useAuth()

    const [cards, setCards] = useState<Card[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [loading, setLoading] = useState(true)
    const [sessionComplete, setSessionComplete] = useState(false)

    useEffect(() => {
        async function fetchDueCards() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/flashcards/due`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                setCards(data.cards)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchDueCards()
    }, [getToken])

    const rateCard = async (quality: number) => {
        const currentCard = cards[currentIndex]
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/flashcards/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ vocabId: currentCard.id, quality }),
            })
        } catch (e) {
            console.error(e)
        }

        setIsFlipped(false)
        if (currentIndex < cards.length - 1) {
            setTimeout(() => setCurrentIndex(i => i + 1), 200)
        } else {
            setSessionComplete(true)
            window.dispatchEvent(new Event('fluenta:progress-updated')) // Update dashboard
        }
    }

    if (loading) return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></main>

    if (cards.length === 0 || sessionComplete) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
                <div className="p-4 rounded-full bg-emerald-500/20 mb-6">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">You're all caught up!</h1>
                <p className="text-zinc-400 mb-8">No flashcards due for review right now.</p>
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-colors">
                    Back to Dashboard
                </button>
            </main>
        )
    }

    const currentCard = cards[currentIndex]

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col p-6">
            <header className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-zinc-800 rounded-lg transition">
                    <ArrowLeft className="w-6 h-6 text-zinc-400" />
                </button>
                <p className="text-zinc-400 font-medium">{currentIndex + 1} / {cards.length}</p>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                <div
                    onClick={() => !isFlipped && setIsFlipped(true)}
                    className="w-full aspect-[3/2] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all hover:border-zinc-700 mb-8"
                >
                    <p className="text-4xl md:text-5xl font-bold mb-4 text-center">
                        {isFlipped ? currentCard.translation : currentCard.word}
                    </p>
                    {!isFlipped && (
                        <p className="text-zinc-500 text-sm flex items-center gap-2 mt-4">
                            <RotateCcw className="w-4 h-4" /> Tap to reveal
                        </p>
                    )}
                </div>

                {isFlipped && (
                    <div className="w-full grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button onClick={() => rateCard(1)} className="p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors text-center">
                            <p className="font-bold text-rose-400">Again</p>
                            <p className="text-xs text-zinc-500 mt-1">&lt; 1m</p>
                        </button>
                        <button onClick={() => rateCard(3)} className="p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-colors text-center">
                            <p className="font-bold text-orange-400">Hard</p>
                            <p className="text-xs text-zinc-500 mt-1">1d</p>
                        </button>
                        <button onClick={() => rateCard(4)} className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors text-center">
                            <p className="font-bold text-emerald-400">Good</p>
                            <p className="text-xs text-zinc-500 mt-1">3d</p>
                        </button>
                        <button onClick={() => rateCard(5)} className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-colors text-center">
                            <p className="font-bold text-blue-400">Easy</p>
                            <p className="text-xs text-zinc-500 mt-1">7d</p>
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}