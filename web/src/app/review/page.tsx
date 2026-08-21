'use client'

/**
 * Review Page: Spaced Repetition Flashcard System
 * 
 * This page implements a spaced repetition review system where students
 * practice vocabulary they've learned. Cards are scheduled based on
 * SM-2 algorithm principles:
 * - Again (quality 0): Card failed, will reappear soon
 * - Hard (quality 3): Barely remembered, shorter interval
 * - Good (quality 4): Remembered well, normal interval
 * - Easy (quality 5): Very easy, longer interval
 * 
 * Key Features:
 * - Instant-tap grading (fires on pointer-down for zero latency)
 * - Sequential save queue (prevents connection storms)
 * - Token caching with auto-refresh on 401
 * - Keyboard shortcuts (Space to flip, 1-4 to grade)
 * - Adaptive Firefly mood based on performance
 * - Session stats tracking
 * 
 * Architecture:
 * - Cards fetched from GET /api/v1/flashcards/due
 * - Reviews saved to POST /api/v1/flashcards/review
 * - Saves run sequentially in background (never block UI)
 * - Failed cards re-added to end of queue
 * - Token cached in ref, refreshed on auth errors
 * 
 * Performance Optimizations:
 * - Instant-tap: Act on pointer-down, not click
 * - No backdrop-blur on cards (prevents mobile jank)
 * - Sequential save queue prevents race conditions
 * - Token ref prevents repeated auth calls
 * 
 * API Endpoints Used:
 * - GET /api/v1/flashcards/due: Fetches cards due for review
 * - POST /api/v1/flashcards/review: Saves review with quality score
 * 
 * The page renders immediately with a skeleton structure while data loads,
 * providing instant feedback instead of a blank loading screen.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import { useEquippedGlow } from '@/lib/useEquippedGlow'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Flashcard structure
 * Each card has Spanish word, English translation, and progress metadata
 */
type Card = { id: string; word: string; translation: string; progress: any }

/**
 * Review Page Component
 * 
 * Main component handling the entire spaced repetition experience.
 * 
 * State Management:
 * - queue: Array of cards due for review
 * - loading: Tracks initial data fetch
 * - flipped: Whether current card shows translation
 * - stats: Session statistics (reviewed, good, agains)
 * - mood: Firefly emotional state based on performance
 * 
 * Performance Refs:
 * - tokenRef: Cached auth token (prevents repeated calls)
 * - saveChain: Sequential promise chain for background saves
 * - lastPointer: Tracks last pointer event for instant-tap
 * 
 * The page renders a skeleton immediately, then updates with real cards.
 */
export default function ReviewPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    // ── Core State ──
    const [queue, setQueue] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [flipped, setFlipped] = useState(false)
    const [stats, setStats] = useState({ reviewed: 0, good: 0, agains: 0 })
    const [mood, setMood] = useState<'idle' | 'proud' | 'dim'>('idle')

    // ── Performance Refs ──
    const tokenRef = useRef<string | null>(null)
    const saveChain = useRef<Promise<void>>(Promise.resolve())
    const lastPointer = useRef(0)

    /**
     * Fetch due cards from backend
     * Uses cached token if available, otherwise fetches new one
     */
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

    /**
     * Enqueue a review save to run sequentially in background
     * 
     * Saves run ONE AT A TIME in a promise chain:
     * - Never blocks the UI
     * - Prevents connection storms
     * - Auto-refreshes token on 401 errors
     * 
     * @param vocabId - Vocabulary item ID
     * @param quality - Review quality (0=Again, 3=Hard, 4=Good, 5=Easy)
     */
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
                
                // Token expired mid-session → refresh once, retry
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

    /**
     * Grade the current card and advance to next
     * 
     * Flow:
     * 1. Remove card from queue (or re-add if quality=0)
     * 2. Update session stats
     * 3. Update Firefly mood based on performance
     * 4. Reset flip state
     * 5. Enqueue background save
     * 
     * @param quality - Review quality score
     */
    const grade = (quality: number) => {
        if (!card) return
        const current = card
        
        // Remove from queue, or re-add to end if failed
        setQueue(q => {
            const rest = q.slice(1)
            return quality === 0 ? [...rest, current] : rest
        })
        
        // Update session stats
        setStats(s => ({
            reviewed: s.reviewed + 1,
            good: s.good + (quality >= 3 ? 1 : 0),
            agains: s.agains + (quality === 0 ? 1 : 0),
        }))
        
        // Update Firefly mood: proud for easy, idle for good, dim for again
        setMood(quality >= 4 ? 'proud' : quality === 3 ? 'idle' : 'dim')
        setFlipped(false)
        enqueueSave(current.id, quality)
    }

    /**
     * Flip card to show translation
     */
    const flip = () => setFlipped(true)

    /**
     * Instant-tap handler for zero-latency interactions
     * 
     * Acts on pointer-down instead of click:
     * - Touch: Fires immediately on touch start
     * - Mouse: Fires on left-click only
     * - Prevents double-fire with timestamp check
     * 
     * @param fn - Function to execute on tap
     * @returns Event handlers object
     */
    const instant = (fn: () => void) => ({
        onPointerDown: (e: React.PointerEvent) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            lastPointer.current = Date.now()
            fn()
        },
        onClick: () => {
            // Only fire click if pointer-down didn't fire recently
            if (Date.now() - lastPointer.current > 400) fn()
        },
    })

    /**
     * Keyboard shortcuts for desktop users
     * 
     * Space/Enter: Flip card
     * 1: Grade Again
     * 2: Grade Hard
     * 3: Grade Good
     * 4: Grade Easy
     */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (loading || finished) return
            if (!flipped && (e.key === ' ' || e.key === 'Enter')) { 
                e.preventDefault()
                flip() 
            }
            else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
                grade([0, 3, 4, 5][Number(e.key) - 1])
            }
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

            {/* ── Header ─ */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/70 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
                    <button 
                        onClick={() => router.push('/dashboard')} 
                        className="flex items-center gap-1.5 sm:gap-2 text-cream/60 hover:text-cream transition-colors text-xs sm:text-sm font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" /> 
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <h1 className="font-display text-lg sm:text-xl font-bold text-cream">Review</h1>
                    <span className="text-xs font-bold text-cream/50">{queue.length} left</span>
                </div>
            </header>

            <div className="mx-auto max-w-md px-3 sm:px-4 py-6 sm:py-10">
                {/* ── Loading Skeleton ─ */}
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-48 sm:h-64 rounded-2xl bg-night-800/70" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="h-16 sm:h-20 rounded-xl bg-night-800/70" />
                            <div className="h-16 sm:h-20 rounded-xl bg-night-800/70" />
                            <div className="h-16 sm:h-20 rounded-xl bg-night-800/70" />
                            <div className="h-16 sm:h-20 rounded-xl bg-night-800/70" />
                        </div>
                        <div className="h-16 rounded-xl bg-night-800/70" />
                    </div>
                ) : finished ? (
                    /* ── Finished State ─ */
                    <div className="text-center py-8 sm:py-16">
                        <div className="flex justify-center mb-4 sm:mb-6">
                            <Firefly mood="proud" size={120} glow={glowColors} />
                        </div>
                        
                        {stats.reviewed === 0 ? (
                            /* ── No Cards Due ─ */
                            <>
                                <h2 className="font-display text-xl sm:text-2xl font-bold text-cream mb-2">All caught up!</h2>
                                <p className="text-cream/60 text-sm sm:text-base mb-6 sm:mb-8">No cards due right now. Ecla is glowing happily.</p>
                                <button 
                                    onClick={() => router.push('/course')} 
                                    className="w-full py-3 sm:py-3.5 rounded-xl bg-glow font-bold text-night-900 hover:bg-glow-bright transition-colors text-sm sm:text-base"
                                >
                                    Back to the Path
                                </button>
                            </>
                        ) : (
                            /* ── Session Complete ─ */
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
                                        className="flex-1 py-3 sm:py-3.5 rounded-xl border border-white/10 bg-night-800/60 font-semibold text-cream hover:bg-night-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                                        Again
                                    </button>
                                    <button 
                                        onClick={() => router.push('/dashboard')} 
                                        className="flex-1 py-3 sm:py-3.5 rounded-xl bg-glow font-bold text-night-900 hover:bg-glow-bright transition-colors text-sm sm:text-base"
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── Flashcard ─
                             Solid bg, NO backdrop-blur (blur = mobile jank)
                             Instant-tap on pointer-down for zero latency
                        */}
                        <button
                            key={card.id}
                            {...(!flipped ? instant(flip) : {})}
                            className={`w-full rounded-card border p-6 sm:p-8 md:p-10 text-center shadow-glow-sm flip-in transition-colors ${
                                flipped 
                                    ? 'border-immersion/40 bg-night-800' 
                                    : 'border-white/10 bg-night-800 hover:border-white/25 active:bg-night-900'
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

                        {/* ── Grading Buttons ─
                             Grid layout: 2 columns on mobile, 4 on sm+
                             Instant-tap fires on pointer-down
                        */}
                        {flipped ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 sm:mt-6 flip-in">
                                <button 
                                    {...instant(() => grade(0))} 
                                    className="py-3 sm:py-3.5 rounded-xl border-2 border-coral/50 bg-coral/10 text-coral font-bold text-xs sm:text-sm hover:bg-coral/20 active:scale-[0.98] transition-transform"
                                >
                                    Again 
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">1</span>
                                </button>
                                <button 
                                    {...instant(() => grade(3))} 
                                    className="py-3 sm:py-3.5 rounded-xl border-2 border-glow/50 bg-glow/10 text-glow font-bold text-xs sm:text-sm hover:bg-glow/20 active:scale-[0.98] transition-transform"
                                >
                                    Hard 
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">2</span>
                                </button>
                                <button 
                                    {...instant(() => grade(4))} 
                                    className="py-3 sm:py-3.5 rounded-xl border-2 border-leaf/50 bg-leaf/10 text-leaf font-bold text-xs sm:text-sm hover:bg-leaf/20 active:scale-[0.98] transition-transform"
                                >
                                    Good 
                                    <span className="block text-[10px] opacity-60 font-semibold mt-0.5">3</span>
                                </button>
                                <button 
                                    {...instant(() => grade(5))} 
                                    className="py-3 sm:py-3.5 rounded-xl border-2 border-drill/50 bg-drill/10 text-drill font-bold text-xs sm:text-sm hover:bg-drill/20 active:scale-[0.98] transition-transform"
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

                        {/* ── Firefly Mood Indicator ─ */}
                        <div className="flex justify-center mt-6 sm:mt-8 pointer-events-none">
                            <Firefly mood={mood} size={64} glow={glowColors} />
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}