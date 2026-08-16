'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    BookOpen, Zap, Music, GraduationCap, Sparkles, X,
    CheckCircle2, XCircle, Heart, ArrowRight,
    MessageCircle, BookOpenCheck, Lightbulb, Ear, Puzzle,
    ChevronRight, AlertTriangle
} from 'lucide-react'
import posthog from 'posthog-js'
import NightBackground from '@/components/NightBackground'
import ModeAmbience from '@/components/ModeAmbience'
import Firefly from '@/components/Firefly'
import { COSMETICS, CosmeticId, DEFAULT_GLOW } from '@/lib/cosmetics'
import { useIntensity } from '@/lib/intensity'
import SpeakerButton from '@/components/SpeakerButton'
import type { TeachBlock, ExerciseV2, SubLessonData } from '@/lib/lessonTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const MODE_META = {
    STORY: { label: 'Story', color: 'text-story', border: 'border-story', bg: 'bg-story', glow: 'shadow-[0_0_24px_rgba(255,180,90,0.4)]', Icon: BookOpen, dot: 'bg-story' },
    DRILL: { label: 'Drill', color: 'text-drill', border: 'border-drill', bg: 'bg-drill', glow: 'shadow-[0_0_24px_rgba(77,216,230,0.4)]', Icon: Zap, dot: 'bg-drill' },
    IMMERSION: { label: 'Immersion', color: 'text-immersion', border: 'border-immersion', bg: 'bg-immersion', glow: 'shadow-[0_0_24px_rgba(185,140,240,0.4)]', Icon: Music, dot: 'bg-immersion' },
    PROFESSIONAL: { label: 'Professional', color: 'text-pro', border: 'border-pro', bg: 'bg-pro', glow: 'shadow-[0_0_24px_rgba(127,166,255,0.4)]', Icon: GraduationCap, dot: 'bg-pro' },
}

type LessonPhase = 'teach' | 'practice' | 'use' | 'celebration'

type MatchItem = {
    id: string
    a: string
    b: string
}

function legacyAsSubLesson(lesson: any): SubLessonData {
    return {
        id: `legacy-${lesson.conceptId}`,
        conceptId: lesson.conceptId,
        orderIndex: 0,
        title: lesson.conceptName,
        icon: 'book-open',
        xpReward: lesson.xpReward || 20,
        teach: [],
        exercises: lesson.variant.exercises || [],
        realLife: null,
    }
}

const ICON_MAP: Record<string, any> = {
    'book-open': BookOpenCheck,
    'ear': Ear,
    'message-circle': MessageCircle,
    'puzzle': Puzzle,
    'lightbulb': Lightbulb,
    'sparkles': Sparkles,
    'alert-triangle': AlertTriangle,
}

export default function LessonPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const modeParam = searchParams.get('mode')
    const { getToken } = useAuth()

    const [lesson, setLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [glowColors, setGlowColors] = useState(DEFAULT_GLOW)

    const [subLessons, setSubLessons] = useState<SubLessonData[]>([])
    const [subLessonIndex, setSubLessonIndex] = useState(0)
    const [completedSubLessons, setCompletedSubLessons] = useState<Set<string>>(new Set())

    const [phase, setPhase] = useState<LessonPhase>('teach')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState<string>('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)
    const [hearts, setHearts] = useState(5)
    const [showXpFloat, setShowXpFloat] = useState(false)
    const [shakeCard, setShakeCard] = useState(false)
    const [fireflyMood, setFireflyMood] = useState<'idle' | 'excited' | 'dim' | 'sad' | 'proud' | 'radiant' | 'thinking'>('idle')
    
    // Match exercise state
    const [matchPairs, setMatchPairs] = useState<MatchItem[]>([])
    const [shuffledB, setShuffledB] = useState<MatchItem[]>([])
    const [selectedA, setSelectedA] = useState<string | null>(null)
    const [selectedB, setSelectedB] = useState<string | null>(null)
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
    const [wrongPair, setWrongPair] = useState<{ a: string; b: string } | null>(null)

    const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        async function fetchLesson() {
            try {
                const token = await getToken()
                const url = `${API_URL}/api/v1/lessons/${params.conceptId}${modeParam ? `?mode=${modeParam}` : ''}`
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) throw new Error('Failed to load lesson')
                const data = await res.json()
                setLesson(data.lesson)

                if (data.lesson.equippedCosmetic && COSMETICS[data.lesson.equippedCosmetic as CosmeticId]) {
                    setGlowColors(COSMETICS[data.lesson.equippedCosmetic as CosmeticId].colors)
                }

                const subs: SubLessonData[] = (data.lesson.subLessons && data.lesson.subLessons.length > 0)
                    ? data.lesson.subLessons
                    : [legacyAsSubLesson(data.lesson)]
                setSubLessons(subs)

                const firstIncomplete = subs.findIndex(s => !data.lesson.completedSubLessons?.includes(s.id))
                setSubLessonIndex(firstIncomplete >= 0 ? firstIncomplete : 0)

                if (subs[firstIncomplete >= 0 ? firstIncomplete : 0]?.teach.length === 0) {
                    setPhase('practice')
                }
            } catch (e) { console.error(e) } finally { setLoading(false) }
        }
        fetchLesson()
    }, [getToken, params.conceptId, modeParam])

    const currentSub = subLessons[subLessonIndex]
    const exercises: ExerciseV2[] = currentSub?.exercises || []
    const currentExercise = exercises[currentIndex]
    const totalSubs = subLessons.length
    const totalExercises = exercises.length

    const subProgressPercent = totalSubs
        ? ((completedSubLessons.size + (phase === 'celebration' ? 1 : 0) + (phase === 'practice' ? currentIndex / Math.max(1, totalExercises) : 0)) / totalSubs) * 100
        : 0

    const checkAnswer = (value: string) => {
        if (isRevealed || !value?.trim()) return
        if (!currentExercise) return

        let correct = false
        if (currentExercise.type === 'mcq' || currentExercise.type === 'listen_choose') {
            correct = value.trim() === currentExercise.answer.trim()
        } else {
            const norm = (s: string) => s.trim().toLowerCase().replace(/[.!?¡¿]/g, '')
            correct = norm(value) === norm(currentExercise.answer)
        }

        setIsCorrect(correct)
        setIsRevealed(true)

        if (correct) {
            setCorrectCount(c => c + 1)
            setFireflyMood('excited')
            setShowXpFloat(true)
            if (floatTimer.current) clearTimeout(floatTimer.current)
            floatTimer.current = setTimeout(() => {
                setShowXpFloat(false)
                setFireflyMood('idle')
            }, 1400)
        } else {
            setHearts(h => Math.max(0, h - 1))
            setShakeCard(true)
            setFireflyMood('dim')
            setTimeout(() => {
                setShakeCard(false)
                setFireflyMood(hearts - 1 === 0 ? 'sad' : 'idle')
            }, 450)
        }
    }

    const initMatchExercise = useCallback((pairs: { a: string; b: string }[]) => {
        const items: MatchItem[] = pairs.map((p, i) => ({
            id: `pair-${i}`,
            a: p.a,
            b: p.b,
        }))
        const shuffled = [...items].sort(() => Math.random() - 0.5)
        setMatchPairs(items)
        setShuffledB(shuffled)
        setMatchedIds(new Set())
        setSelectedA(null)
        setSelectedB(null)
        setWrongPair(null)
    }, [])

    const handleMatchClick = useCallback((side: 'a' | 'b', id: string) => {
        if (matchedIds.has(id)) return
        if (wrongPair) return // animating wrong pair

        if (side === 'a') {
            if (selectedA === id) {
                setSelectedA(null)
                return
            }
            setSelectedA(id)
            
            if (selectedB) {
                if (id === selectedB) {
                    // Match found!
                    const newMatched = new Set([...matchedIds, id])
                    setMatchedIds(newMatched)
                    setSelectedA(null)
                    setSelectedB(null)
                    setFireflyMood('excited')
                    setTimeout(() => setFireflyMood('idle'), 800)
                    
                    // Check if all matched
                    if (newMatched.size === matchPairs.length) {
                        setTimeout(() => {
                            setIsRevealed(true)
                            setIsCorrect(true)
                            setCorrectCount(c => c + 1)
                        }, 600)
                    }
                } else {
                    // Wrong pair
                    setWrongPair({ a: id, b: selectedB })
                    setFireflyMood('dim')
                    setTimeout(() => {
                        setWrongPair(null)
                        setSelectedA(null)
                        setSelectedB(null)
                        setFireflyMood('idle')
                    }, 500)
                }
            }
        } else {
            if (selectedB === id) {
                setSelectedB(null)
                return
            }
            setSelectedB(id)
            
            if (selectedA) {
                if (id === selectedA) {
                    // Match found!
                    const newMatched = new Set([...matchedIds, id])
                    setMatchedIds(newMatched)
                    setSelectedA(null)
                    setSelectedB(null)
                    setFireflyMood('excited')
                    setTimeout(() => setFireflyMood('idle'), 800)
                    
                    // Check if all matched
                    if (newMatched.size === matchPairs.length) {
                        setTimeout(() => {
                            setIsRevealed(true)
                            setIsCorrect(true)
                            setCorrectCount(c => c + 1)
                        }, 600)
                    }
                } else {
                    // Wrong pair
                    setWrongPair({ a: selectedA, b: id })
                    setFireflyMood('dim')
                    setTimeout(() => {
                        setWrongPair(null)
                        setSelectedA(null)
                        setSelectedB(null)
                        setFireflyMood('idle')
                    }, 500)
                }
            }
        }
    }, [selectedA, selectedB, matchedIds, matchPairs.length, wrongPair])

    const handleNext = () => {
        if (currentIndex < totalExercises - 1) {
            setCurrentIndex(i => i + 1)
            setUserInput('')
            setIsRevealed(false)
            setIsCorrect(false)
            setMatchPairs([])
            setShuffledB([])
            setSelectedA(null)
            setSelectedB(null)
            setMatchedIds(new Set())
            setWrongPair(null)
        } else {
            if (currentSub?.realLife) {
                setPhase('use')
            } else {
                completeSubLesson()
            }
        }
    }

    const completeSubLesson = () => {
        setCompletedSubLessons(prev => new Set([...prev, currentSub.id]))

        if (subLessonIndex < totalSubs - 1) {
            const nextIdx = subLessonIndex + 1
            setSubLessonIndex(nextIdx)
            setCurrentIndex(0)
            setUserInput('')
            setIsRevealed(false)
            setIsCorrect(false)
            setCorrectCount(0)
            setMatchPairs([])
            setShuffledB([])
            setSelectedA(null)
            setSelectedB(null)
            setMatchedIds(new Set())
            setPhase(subLessons[nextIdx].teach.length > 0 ? 'teach' : 'practice')
        } else {
            setPhase('celebration')
            saveProgress()
        }
    }

    const saveProgress = useCallback(async () => {
        if (!lesson) return
        setSaving(true)
        try {
            const token = await getToken()
            const totalSubXp = subLessons.reduce((sum, s) => sum + (s.xpReward || 0), 0)
            const xpEarned = Math.round((completedSubLessons.size + 1) / Math.max(1, totalSubs) * totalSubXp)

            const res = await fetch(`${API_URL}/api/v1/lessons/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    conceptId: lesson.conceptId,
                    subLessonId: currentSub?.id,
                    mode: lesson.mode,
                    correctCount,
                    incorrectCount: totalExercises - correctCount,
                    xpEarned,
                }),
            })

            if (res.ok) {
                posthog.capture('lesson_completed', {
                    concept_id: lesson.conceptId,
                    sub_lessons_completed: completedSubLessons.size + 1,
                    mode: lesson.mode,
                    xp_earned: xpEarned,
                })
                window.dispatchEvent(new Event('luma:progress-updated'))
            }
        } catch (e) { console.error('Network error saving progress:', e) } finally { setSaving(false) }
    }, [lesson, correctCount, getToken, subLessons, completedSubLessons, totalSubs, currentSub, totalExercises])

    if (loading) {
        return (
            <main className="min-h-screen font-body">
                <NightBackground />
                <div className="flex min-h-screen items-center justify-center"><Firefly mood="thinking" size={120} /></div>
            </main>
        )
    }

    if (!lesson) {
        return (
            <main className="min-h-screen font-body">
                <NightBackground />
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
                    <Firefly mood="sad" size={140} glow={glowColors} />
                    <h1 className="font-display text-xl font-bold text-cream">Lesson not found</h1>
                    <button onClick={() => router.push('/course')} className="rounded-xl bg-glow px-5 py-2.5 font-bold text-night-900 transition-colors hover:bg-glow-bright">
                        Back to Path
                    </button>
                </div>
            </main>
        )
    }

    const meta = MODE_META[lesson.mode as keyof typeof MODE_META]
    const intensity = useIntensity(lesson.mode)
    const totalXp = subLessons.reduce((sum, s) => sum + (s.xpReward || 0), 0)
    const xpEarned = Math.round((completedSubLessons.size + (phase === 'celebration' ? 1 : 0)) / Math.max(1, totalSubs) * totalXp)

    const renderTeachBlock = (block: TeachBlock, i: number) => {
        switch (block.type) {
            case 'explain':
                return (
                    <div key={i} className="rounded-xl border border-white/5 bg-night-900/40 p-4 md:p-5">
                        <p className="text-sm md:text-base leading-relaxed text-cream/90">{block.text}</p>
                    </div>
                )
            case 'example':
                return (
                    <div key={i} className="rounded-xl border border-white/10 bg-night-900/60 p-4 md:p-5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-lg md:text-xl font-bold text-cream leading-snug flex-1">{block.es}</p>
                            <SpeakerButton text={block.es} lang="es-ES" size="md" />
                        </div>
                        <p className="text-sm text-cream/60 italic">{block.en}</p>
                    </div>
                )
            case 'vocab':
                return (
                    <div key={i} className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-2">Vocabulary</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {block.items.map((item, j) => (
                                <div
                                    key={j}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-night-900/60 p-3 hover:border-glow/30 hover:bg-night-900 transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display text-sm md:text-base font-bold text-cream truncate">{item.word}</p>
                                        <p className="text-xs text-cream/50 truncate">{item.translation}</p>
                                    </div>
                                    <SpeakerButton text={item.word} lang="es-ES" size="sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 'tip':
                return (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl border border-glow/20 bg-glow/5 p-3.5 md:p-4">
                        <Lightbulb className="h-4 w-4 text-glow flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-cream/80 leading-relaxed">{block.text}</p>
                    </div>
                )
            case 'alphabet':
                return (
                    <div key={i} className="rounded-xl border border-white/10 bg-night-900/60 p-4 md:p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-2">Pronunciation</p>
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-base md:text-lg font-bold text-cream flex-1">{block.text}</p>
                            <SpeakerButton text={block.text} lang="es-ES" size="md" />
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    const renderExercise = () => {
        if (!currentExercise) return null

        switch (currentExercise.type) {
            case 'mcq':
            case 'listen_choose':
                return (
                    <>
                        {currentExercise.type === 'listen_choose' && (
                            <>
                                <div className="mb-4 flex items-center justify-center">
                                    <SpeakerButton text={currentExercise.audio} lang="es-ES" size="lg" />
                                </div>
                                <p className="text-center text-xs text-cream/50 mb-4">Listen and pick the correct translation</p>
                            </>
                        )}
                        <div className="space-y-2">
                            {(currentExercise.options || []).map((option, i) => {
                                const isCorrectOption = option === currentExercise.answer
                                const isSelected = userInput === option
                                let styles = 'border-white/10 bg-night-900/50 hover:border-white/25 hover:bg-night-900'
                                if (isRevealed) {
                                    if (isCorrectOption) styles = 'border-leaf/50 bg-leaf/10 text-leaf'
                                    else if (isSelected && !isCorrectOption) styles = 'border-coral/50 bg-coral/10 text-coral'
                                    else styles = 'border-white/5 bg-night-900/30 opacity-50'
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => !isRevealed && checkAnswer(option)}
                                        disabled={isRevealed}
                                        className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${styles}`}
                                    >
                                        <span className="text-sm font-medium">{option}</span>
                                        {isRevealed && isCorrectOption && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                                        {isRevealed && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 flex-shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )

            case 'fill_blank':
            case 'translate':
            case 'listen_type':
                return (
                    <>
                        {currentExercise.type === 'listen_type' && (
                            <>
                                <div className="mb-4 flex items-center justify-center">
                                    <SpeakerButton text={currentExercise.audio} lang="es-ES" size="lg" />
                                </div>
                                <p className="text-center text-xs text-cream/50 mb-4">Type what you hear</p>
                            </>
                        )}
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isRevealed}
                            className={`w-full p-3 rounded-xl border-2 bg-night-900/50 text-cream text-base focus:outline-none transition-all ${isRevealed ? isCorrect ? 'border-leaf/50' : 'border-coral/50' : 'border-white/10 focus:border-glow focus:bg-night-900'}`}
                            placeholder={currentExercise.type === 'fill_blank' ? "Type your answer..." : currentExercise.type === 'translate' ? "Type the translation..." : "Type what you hear..."}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && !isRevealed && checkAnswer(userInput)}
                        />
                        {!isRevealed && (
                            <button
                                onClick={() => checkAnswer(userInput)}
                                disabled={!userInput.trim()}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-3 ${meta?.bg || 'bg-glow'} text-night-900 hover:brightness-110`}
                            >
                                Check Answer
                            </button>
                        )}
                    </>
                )

            case 'match':
                if (matchPairs.length === 0 && currentExercise.pairs) {
                    initMatchExercise(currentExercise.pairs)
                }
                
                const allMatched = matchPairs.length > 0 && matchedIds.size === matchPairs.length

                const getAStyles = (id: string) => {
                    if (matchedIds.has(id)) return 'border-leaf/40 bg-leaf/10 text-leaf opacity-50 cursor-default'
                    if (wrongPair?.a === id) return 'border-coral bg-coral/20 text-coral'
                    if (selectedA === id) return 'border-glow bg-glow/15 text-cream ring-2 ring-glow/30'
                    return 'border-white/10 bg-night-900/60 text-cream hover:border-white/25'
                }

                const getBStyles = (id: string) => {
                    if (matchedIds.has(id)) return 'border-leaf/40 bg-leaf/10 text-leaf opacity-50 cursor-default'
                    if (wrongPair?.b === id) return 'border-coral bg-coral/20 text-coral'
                    if (selectedB === id) return 'border-glow bg-glow/15 text-cream ring-2 ring-glow/30'
                    return 'border-white/10 bg-night-900/60 text-cream hover:border-white/25'
                }

                return (
                    <div className="space-y-3">
                        <p className="text-xs text-cream/50 text-center mb-3">
                            {selectedA ? 'Now tap the matching translation' : 'Tap a word, then its match'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div className="space-y-2">
                                {matchPairs.map((pair) => (
                                    <button
                                        key={`a-${pair.id}`}
                                        onClick={() => handleMatchClick('a', pair.id)}
                                        disabled={matchedIds.has(pair.id) || !!wrongPair}
                                        className={`w-full p-2.5 md:p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${getAStyles(pair.id)}`}
                                    >
                                        {pair.a}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {shuffledB.map((pair) => (
                                    <button
                                        key={`b-${pair.id}`}
                                        onClick={() => handleMatchClick('b', pair.id)}
                                        disabled={matchedIds.has(pair.id) || !!wrongPair}
                                        className={`w-full p-2.5 md:p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${getBStyles(pair.id)}`}
                                    >
                                        {pair.b}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {allMatched && isRevealed && (
                            <div className="mt-4 rounded-lg border border-leaf/30 bg-leaf/10 p-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-leaf" />
                                <span className="text-sm font-medium text-leaf">All matched!</span>
                            </div>
                        )}
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <main className="min-h-screen font-body">
            <style>{`
                @keyframes xp-float { 0% { opacity: 0; transform: translateY(0) scale(.6); } 20% { opacity: 1; transform: translateY(-10px) scale(1.1); } 80% { opacity: 1; transform: translateY(-40px) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(.8); } }
                .xp-float { animation: xp-float 1.4s ease-out forwards; }
                @keyframes card-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
                .card-shake { animation: card-shake .4s ease-in-out; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fade-in .4s ease-out both; }
            `}</style>

            <NightBackground />
            <ModeAmbience mode={lesson.mode} />

            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/80 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-3 md:px-4 h-14 md:h-16 flex items-center gap-3">
                    <button onClick={() => router.push('/course')} className="rounded-lg p-2 text-cream/60 hover:bg-night-800 hover:text-cream transition-colors">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex-1 relative h-2.5 md:h-3">
                        <div className="absolute inset-0 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${meta?.bg || 'bg-glow'} transition-all ease-out ${lesson.mode === 'DRILL' ? 'duration-200' : 'duration-500'}`}
                                style={{
                                    width: `${Math.min(100, subProgressPercent)}%`,
                                    boxShadow: intensity.glowEffects ? undefined : 'none'
                                }}
                            />
                        </div>
                    </div>

                    <span className="text-[11px] md:text-xs font-bold text-cream/50 whitespace-nowrap">
                        {completedSubLessons.size + (phase === 'celebration' ? 1 : 0)}/{totalSubs}
                    </span>

                    <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Heart
                                key={i}
                                className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-all duration-300 ${i < hearts
                                        ? intensity.glowEffects ? 'fill-coral text-coral' : 'fill-cream/70 text-cream/70'
                                        : 'text-cream/15'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-3 md:px-4 py-4 md:py-8">

                {phase !== 'celebration' && currentSub && (
                    <div className="mb-4 md:mb-6 fade-in">
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center ${meta?.bg || 'bg-glow'} ${meta?.text || 'text-night-900'}`}>
                                {(() => {
                                    const SubIcon = ICON_MAP[currentSub.icon] || Sparkles
                                    return <SubIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                })()}
                            </div>
                            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-cream/40">
                                Part {subLessonIndex + 1} of {totalSubs}
                            </span>
                        </div>
                        <h1 className="font-display text-xl md:text-2xl font-black text-cream leading-tight">
                            {currentSub.title}
                        </h1>
                    </div>
                )}

                {phase === 'teach' && currentSub && (
                    <div className="space-y-3 fade-in">
                        <div className="flex items-center gap-2 text-glow text-[11px] md:text-xs font-bold uppercase tracking-wider mb-1">
                            <BookOpenCheck className="h-3 w-3 md:h-3.5 md:w-3.5" />
                            Understand
                        </div>

                        {currentSub.teach.map((block, i) => renderTeachBlock(block, i))}

                        <button
                            onClick={() => {
                                setPhase('practice')
                                setCurrentIndex(0)
                                setUserInput('')
                                setIsRevealed(false)
                            }}
                            className={`w-full py-3.5 rounded-xl font-bold text-night-900 text-sm md:text-base transition-all hover:brightness-110 flex items-center justify-center gap-2 mt-4 ${meta?.bg || 'bg-glow'}`}
                        >
                            Start Practice
                            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                    </div>
                )}

                {phase === 'practice' && currentSub && currentExercise && (
                    <div className={`relative ${shakeCard ? 'card-shake' : ''} fade-in`}>
                        <div className="flex items-center gap-2 text-drill text-[11px] md:text-xs font-bold uppercase tracking-wider mb-3">
                            <Puzzle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                            Practice
                            <span className="text-cream/40 ml-auto">
                                {currentIndex + 1} of {totalExercises}
                            </span>
                        </div>

                        {intensity.showComboBanner && showXpFloat && (
                            <div className="pointer-events-none absolute left-1/2 -top-3 z-10 xp-float">
                                <div className="inline-flex items-center gap-1 rounded-full bg-glow px-2.5 py-1 text-xs font-black text-night-900 shadow-glow-md">
                                    <Sparkles className="h-3 w-3" /> +{Math.round(currentSub.xpReward / totalExercises)} XP
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-white/10 bg-night-800/70 p-4 md:p-6 backdrop-blur-sm shadow-glow-sm relative overflow-hidden">
                            <div className={`absolute inset-x-0 top-0 h-1 ${meta?.bg} opacity-70`} />

                            {(currentExercise.type === 'mcq' || currentExercise.type === 'fill_blank' || currentExercise.type === 'translate') && (
                                <h2 className="font-display text-base md:text-lg font-bold text-cream leading-snug mb-4 md:mb-5">
                                    {currentExercise.prompt}
                                </h2>
                            )}

                            {renderExercise()}

                            {isRevealed && currentExercise.type !== 'match' && (
                                <div className="mt-5 space-y-3">
                                    {isCorrect ? (
                                        <div className="rounded-lg border border-leaf/30 bg-leaf/10 p-3">
                                            <div className="flex items-start gap-2.5">
                                                {intensity.playfulCopy ? (
                                                    <Firefly mood="proud" size={40} glow={glowColors} />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 text-leaf flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1 space-y-1.5">
                                                    <p className="text-sm font-semibold text-leaf">{intensity.playfulCopy ? 'Perfect!' : 'Correct.'}</p>
                                                    {currentExercise.whyExplanation && (
                                                        <p className="text-xs text-cream/80 leading-relaxed">
                                                            <span className="font-semibold">Why:</span> {currentExercise.whyExplanation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-coral/30 bg-coral/10 p-3 space-y-2">
                                            <div className="flex items-start gap-2.5">
                                                {intensity.playfulCopy ? (
                                                    <Firefly mood="sad" size={40} glow={glowColors} />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1 space-y-1.5">
                                                    <p className="text-sm font-semibold text-coral">{intensity.playfulCopy ? 'Not quite right.' : 'Incorrect.'}</p>
                                                    <p className="text-xs text-cream/80">
                                                        <span className="font-semibold">Answer:</span> <span className="font-bold text-cream">{currentExercise.answer}</span>
                                                    </p>
                                                    {currentExercise.whyExplanation && (
                                                        <p className="text-xs text-cream/80 leading-relaxed border-t border-coral/20 pt-2 mt-2">
                                                            <span className="font-semibold">Why:</span> {currentExercise.whyExplanation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        className={`w-full py-3 rounded-xl font-bold text-sm text-night-900 transition-all hover:brightness-110 flex items-center justify-center gap-2 ${meta?.bg || 'bg-glow'}`}
                                    >
                                        {currentIndex === totalExercises - 1
                                            ? (currentSub.realLife ? 'Use it in real life' : 'Finish this part')
                                            : 'Continue'}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {isRevealed && currentExercise.type === 'match' && (
                                <div className="mt-4">
                                    <button
                                        onClick={handleNext}
                                        className={`w-full py-3 rounded-xl font-bold text-sm text-night-900 transition-all hover:brightness-110 flex items-center justify-center gap-2 ${meta?.bg || 'bg-glow'}`}
                                    >
                                        {currentIndex === totalExercises - 1
                                            ? (currentSub.realLife ? 'Use it in real life' : 'Finish this part')
                                            : 'Continue'}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {phase === 'use' && currentSub?.realLife && (
                    <div className="fade-in">
                        <div className="flex items-center gap-2 text-immersion text-[11px] md:text-xs font-bold uppercase tracking-wider mb-3">
                            <MessageCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                            Use it
                        </div>

                        <div className="rounded-xl border border-glow/30 bg-gradient-to-br from-night-800/80 to-night-900/80 p-4 md:p-6 backdrop-blur-sm shadow-glow-md">
                            <div className="flex items-start gap-3 mb-5">
                                <div className="flex-shrink-0">
                                    <Firefly mood="proud" size={56} glow={glowColors} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-glow mb-1.5">Your mission</p>
                                    <p className="font-display text-base md:text-lg font-bold text-cream leading-snug">
                                        {currentSub.realLife.prompt}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <button
                                    onClick={() => router.push(`/chat?seed=${encodeURIComponent(currentSub.realLife.chatSeed || '')}`)}
                                    className="w-full py-3 rounded-xl bg-pro text-night-900 font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(127,166,255,0.35)]"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Practice with Ecla
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={completeSubLesson}
                                    className="w-full py-2.5 rounded-xl border border-white/10 bg-night-900/60 text-cream text-sm font-semibold transition-all hover:bg-night-900 hover:border-white/25"
                                >
                                    {subLessonIndex < totalSubs - 1 ? 'Continue to next part' : 'Finish lesson'}
                                </button>
                            </div>

                            <p className="text-[11px] text-cream/40 text-center mt-3">
                                Chat is optional — you can always come back.
                            </p>
                        </div>
                    </div>
                )}

                {phase === 'celebration' && (
                    <div className="py-6 md:py-12 text-center fade-in">
                        {intensity.fullCelebration ? (
                            <>
                                <div className="mb-6 flex justify-center"><Firefly mood="proud" size={140} glow={glowColors} /></div>
                                <h1 className="font-display text-3xl md:text-4xl font-black text-cream mb-2">Radiant!</h1>
                                <p className="text-cream/60 text-sm md:text-base mb-6">You mastered every part of this lesson.</p>
                            </>
                        ) : (
                            <>
                                <div className="mb-6 flex justify-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf/15 border-2 border-leaf/40">
                                        <CheckCircle2 className="h-10 w-10 text-leaf" />
                                    </div>
                                </div>
                                <h1 className="font-display text-2xl md:text-3xl font-black text-cream mb-2">Lesson complete.</h1>
                                <p className="text-cream/60 text-sm md:text-base mb-6">Here's how you did.</p>
                            </>
                        )}

                        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
                            <div className={`rounded-xl border ${intensity.glowEffects ? 'border-glow/30' : 'border-white/10'} bg-night-800/70 p-3`}>
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5">Earned</p>
                                <p className={`font-display text-xl md:text-2xl font-bold ${intensity.glowEffects ? 'text-glow' : 'text-cream'}`}>+{xpEarned}</p>
                                <p className="text-[10px] md:text-xs text-cream/50">XP</p>
                            </div>
                            <div className="rounded-xl border border-leaf/30 bg-night-800/70 p-3">
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5">Parts</p>
                                <p className="font-display text-xl md:text-2xl font-bold text-leaf">{totalSubs}</p>
                                <p className="text-[10px] md:text-xs text-cream/50">done</p>
                            </div>
                            <div className="rounded-xl border border-coral/30 bg-night-800/70 p-3">
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5">Hearts</p>
                                <p className="font-display text-xl md:text-2xl font-bold text-coral">{hearts}/5</p>
                                <p className="text-[10px] md:text-xs text-cream/50">left</p>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/course')}
                            className="w-full py-3 rounded-xl bg-glow font-bold text-night-900 text-sm md:text-base transition-all hover:bg-glow-bright flex items-center justify-center gap-2"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Continue Path'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}