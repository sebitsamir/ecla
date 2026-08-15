'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    BookOpen, Zap, Music, GraduationCap, Sparkles, X,
    CheckCircle2, XCircle, Heart, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react'
import posthog from 'posthog-js'
import NightBackground from '@/components/NightBackground'
import ModeAmbience, { MODE_BEHAVIOR } from '@/components/ModeAmbience'
import Firefly from '@/components/Firefly'
import { COSMETICS, CosmeticId, DEFAULT_GLOW } from '@/lib/cosmetics'
import { useIntensity } from '@/lib/intensity'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Exercise = {
    type: 'mcq' | 'fill_blank' | 'translate'
    prompt: string
    options?: string[]
    answer: string
    hint?: string
}

const MODE_META = {
    STORY: { label: 'Story', color: 'text-story', border: 'border-story', bg: 'bg-story', glow: 'shadow-[0_0_24px_rgba(255,180,90,0.4)]', Icon: BookOpen, dot: 'bg-story' },
    DRILL: { label: 'Drill', color: 'text-drill', border: 'border-drill', bg: 'bg-drill', glow: 'shadow-[0_0_24px_rgba(77,216,230,0.4)]', Icon: Zap, dot: 'bg-drill' },
    IMMERSION: { label: 'Immersion', color: 'text-immersion', border: 'border-immersion', bg: 'bg-immersion', glow: 'shadow-[0_0_24px_rgba(185,140,240,0.4)]', Icon: Music, dot: 'bg-immersion' },
    PROFESSIONAL: { label: 'Professional', color: 'text-pro', border: 'border-pro', bg: 'bg-pro', glow: 'shadow-[0_0_24px_rgba(127,166,255,0.4)]', Icon: GraduationCap, dot: 'bg-pro' },
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

    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState<string>('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)
    const [hearts, setHearts] = useState(5)
    const [showXpFloat, setShowXpFloat] = useState(false)
    const [shakeCard, setShakeCard] = useState(false)
    const [fireflyMood, setFireflyMood] = useState<'idle' | 'excited' | 'dim' | 'sad' | 'proud' | 'radiant' | 'thinking'>('idle')
    const [contextExpanded, setContextExpanded] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [glowColors, setGlowColors] = useState(DEFAULT_GLOW)

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
            } catch (e) { console.error(e) } finally { setLoading(false) }
        }
        fetchLesson()
    }, [getToken, params.conceptId, modeParam])

    const checkAnswer = (value: string) => {
        if (isRevealed || !value.trim()) return

        const exercises: Exercise[] = lesson.variant.exercises
        const currentExercise = exercises[currentIndex]

        const normalizedInput = value.trim().toLowerCase()
        const normalizedAnswer = currentExercise.answer.trim().toLowerCase()

        const correct = normalizedInput === normalizedAnswer
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

    const handleNext = () => {
        const exercises: Exercise[] = lesson.variant.exercises
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(i => i + 1)
            setUserInput('')
            setIsRevealed(false)
            setIsCorrect(false)
        } else {
            setIsFinished(true)
            saveProgress()
        }
    }

    const saveProgress = useCallback(async () => {
        if (!lesson) return
        setSaving(true)
        try {
            const token = await getToken()
            const totalQuestions = lesson.variant.exercises.length
            const xpEarned = Math.round((correctCount / totalQuestions) * (lesson.xpReward || 20))

            const res = await fetch(`${API_URL}/api/v1/lessons/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    conceptId: lesson.conceptId,
                    mode: lesson.mode,
                    correctCount,
                    incorrectCount: totalQuestions - correctCount,
                    xpEarned,
                }),
            })

            if (res.ok) {
                posthog.capture('lesson_completed', {
                    concept_id: lesson.conceptId,
                    mode: lesson.mode,
                    xp_earned: xpEarned,
                    score: correctCount,
                    total_questions: totalQuestions
                })
                window.dispatchEvent(new Event('luma:progress-updated'))
            }
        } catch (e) { console.error('Network error saving progress:', e) } finally { setSaving(false) }
    }, [lesson, correctCount, getToken])

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
                    <h1 className="font-display text-2xl font-bold text-cream">Lesson not found</h1>
                    <button onClick={() => router.push('/course')} className="rounded-xl bg-glow px-6 py-3 font-bold text-night-900 transition-colors hover:bg-glow-bright">
                        Back to Path
                    </button>
                </div>
            </main>
        )
    }

    const exercises: Exercise[] = lesson.variant.exercises || []
    const currentExercise = exercises[currentIndex]
    const total = exercises.length
    const progressPercent = total ? ((currentIndex + (isRevealed ? 1 : 0)) / total) * 100 : 0
    const meta = MODE_META[lesson.mode as keyof typeof MODE_META]
    const intensity = useIntensity(lesson.mode)
    const Icon = meta?.Icon || Sparkles
    const xpEarned = Math.round((correctCount / Math.max(1, total)) * (lesson.xpReward || 20))

    return (
        <main className="min-h-screen font-body">
            <style>{`
                @keyframes xp-float { 0% { opacity: 0; transform: translateY(0) scale(.6); } 20% { opacity: 1; transform: translateY(-10px) scale(1.1); } 80% { opacity: 1; transform: translateY(-40px) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(.8); } }
                .xp-float { animation: xp-float 1.4s ease-out forwards; }
                @keyframes card-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
                .card-shake { animation: card-shake .4s ease-in-out; }
            `}</style>

            <NightBackground />
            <ModeAmbience mode={lesson.mode} />

            {/* Top bar */}
            <header className={`sticky top-0 z-40 backdrop-blur-md bg-night-950/80 border-b ${meta?.border || 'border-white/5'}/20`}>
                <div className="mx-auto max-w-3xl px-4 h-16 flex items-center gap-4">
                    <button onClick={() => router.push('/course')} className="rounded-lg p-2 text-cream/60 hover:bg-night-800 hover:text-cream transition-colors">
                        <X className="h-5 w-5" />
                    </button>

                    {/* Progress trail — firefly rider hidden in minimal mode */}
                    <div className="flex-1 relative h-4">
                        <div className="absolute inset-0 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${meta?.bg || 'bg-glow'} transition-all ease-out ${lesson.mode === 'DRILL' ? 'duration-200' : 'duration-500'}`}
                                style={{ 
                                    width: `${progressPercent}%`,
                                    boxShadow: intensity.glowEffects ? undefined : 'none'
                                }}
                            />
                        </div>
                        {/* Firefly rider — only in full/high modes */}
                        {!isFinished && intensity.showMascot && (
                            <div
                                className={`absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all ease-out ${MODE_BEHAVIOR[lesson.mode] ?? ''} ${lesson.mode === 'DRILL' ? 'duration-200' : 'duration-500'}`}
                                style={{ left: `calc(${progressPercent}% - 14px)` }}
                            >
                                <Firefly mood={fireflyMood} size={32} glow={glowColors} />
                            </div>
                        )}
                    </div>

                    {/* Hearts — cleaner in minimal mode */}
                    <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Heart 
                                key={i} 
                                className={`h-5 w-5 transition-all duration-300 ${
                                    i < hearts 
                                        ? intensity.glowEffects 
                                            ? 'fill-coral text-coral' 
                                            : 'fill-cream/70 text-cream/70' 
                                        : 'text-cream/15'
                                }`} 
                            />
                        ))}
                    </div>
                </div>
            </header>

            {!isFinished ? (
                <div className="mx-auto max-w-3xl px-4 py-8">
                    {/* Context pill */}
                    {lesson.mode !== 'DRILL' && (lesson.variant.storyBeat || lesson.variant.culturalRef || lesson.variant.formalPhrase) && (
                        <div className="mb-6">
                            <button
                                onClick={() => setContextExpanded(!contextExpanded)}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-night-800/70 px-4 py-2 text-sm font-semibold text-cream/70 transition-all hover:bg-night-800 hover:text-cream backdrop-blur-sm"
                            >
                                <Icon className={`h-4 w-4 ${meta?.color || 'text-cream'}`} />
                                <span className="truncate max-w-[200px]">{lesson.variant.storyBeat || lesson.variant.culturalRef || lesson.variant.formalPhrase}</span>
                                {contextExpanded ? <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />}
                            </button>
                            {contextExpanded && (
                                <div className="mt-2 rounded-2xl border border-white/10 bg-night-800/70 p-4 text-sm leading-relaxed text-cream/70 backdrop-blur-sm">
                                    {lesson.variant.storyBeat || lesson.variant.culturalRef || lesson.variant.formalPhrase}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Question card */}
                    <div className={`relative ${shakeCard ? 'card-shake' : ''}`}>
                        {/* Floating +XP — suppressed in minimal mode */}
                        {intensity.showComboBanner && showXpFloat && (
                            <div className="pointer-events-none absolute left-1/2 -top-4 z-10 xp-float">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-glow px-3 py-1 text-sm font-black text-night-900 shadow-glow-md">
                                    <Sparkles className="h-3.5 w-3.5" /> +{Math.round((lesson.xpReward || 20) / total)} XP
                                </div>
                            </div>
                        )}

                        <div className="rounded-card border border-white/10 bg-night-800/70 p-6 md:p-8 backdrop-blur-sm shadow-glow-sm relative overflow-hidden">
                            {/* Mode accent bar */}
                            <div className={`absolute inset-x-0 top-0 h-1 ${meta?.bg} opacity-70`} />

                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-cream/40">Question {currentIndex + 1} of {total}</p>
                                <span className={`flex items-center gap-1.5 text-xs font-bold ${meta?.color}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot}`} />
                                    {meta?.label} Mode
                                </span>
                            </div>
                            
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-cream leading-tight mb-6">
                                {currentExercise?.prompt}
                            </h2>

                            {/* Dynamic Exercise Input */}
                            <div className="space-y-3">
                                {currentExercise?.type === 'mcq' && currentExercise.options?.map((option, i) => {
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
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group ${styles}`}
                                        >
                                            <span className="font-semibold">{option}</span>
                                            {isRevealed && isCorrectOption && <CheckCircle2 className="h-5 w-5" />}
                                            {isRevealed && isSelected && !isCorrectOption && <XCircle className="h-5 w-5" />}
                                        </button>
                                    )
                                })}

                                {(currentExercise?.type === 'fill_blank' || currentExercise?.type === 'translate') && (
                                    <>
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            disabled={isRevealed}
                                            className={`w-full p-4 rounded-xl border-2 bg-night-900/50 text-cream text-lg focus:outline-none transition-all ${isRevealed ? isCorrect ? 'border-leaf/50' : 'border-coral/50' : 'border-white/10 focus:border-glow focus:bg-night-900'
                                                }`}
                                            placeholder={currentExercise.type === 'fill_blank' ? "Type your answer..." : "Type the translation..."}
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && !isRevealed && checkAnswer(userInput)}
                                        />
                                        {!isRevealed && (
                                            <button
                                                onClick={() => checkAnswer(userInput)}
                                                disabled={!userInput.trim()}
                                                className={`w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${meta?.bg || 'bg-glow'} text-night-900 hover:brightness-110`}
                                            >
                                                Check Answer
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Feedback */}
                            {isRevealed && (
                                <div className="mt-6">
                                    {isCorrect ? (
                                        intensity.playfulCopy ? (
                                            <div className="flex items-center gap-3 rounded-xl border border-leaf/30 bg-leaf/10 p-4">
                                                <Firefly mood="proud" size={48} glow={glowColors} />
                                                <p className="font-semibold text-leaf">Perfect! Keep going.</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 rounded-xl border border-leaf/30 bg-leaf/10 p-4">
                                                <CheckCircle2 className="h-6 w-6 text-leaf flex-shrink-0" />
                                                <p className="font-semibold text-leaf">Correct.</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 space-y-2">
                                            <div className="flex items-center gap-3">
                                                {intensity.playfulCopy ? (
                                                    <Firefly mood="sad" size={48} glow={glowColors} />
                                                ) : (
                                                    <XCircle className="h-6 w-6 text-coral flex-shrink-0" />
                                                )}
                                                <p className="font-semibold text-coral">{intensity.playfulCopy ? 'Not quite right.' : 'Incorrect.'}</p>
                                            </div>
                                            <p className={`text-sm text-cream/80 ${intensity.playfulCopy ? 'pl-[60px]' : 'pl-[36px]'}`}>
                                                Correct answer: <span className="font-bold text-cream">{currentExercise.answer}</span>
                                            </p>
                                            {currentExercise.hint && (
                                                <p className={`text-xs text-cream/60 italic ${intensity.playfulCopy ? 'pl-[60px]' : 'pl-[36px]'}`}>
                                                    {intensity.playfulCopy ? '💡' : '—'} {currentExercise.hint}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        className={`mt-4 w-full py-4 rounded-xl font-bold text-night-900 transition-all hover:brightness-110 flex items-center justify-center gap-2 ${meta?.bg || 'bg-glow'}`}
                                    >
                                        {currentIndex === total - 1 ? 'Finish Lesson' : 'Continue'}
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Celebration screen — intensity-aware */
                <div className="mx-auto max-w-md px-4 py-16 text-center relative">
                    <ModeAmbience mode={lesson.mode} />

                    {intensity.fullCelebration ? (
                        /* Full celebration: firefly hero + "Radiant!" */
                        <>
                            <div className="mb-8 flex justify-center relative z-10"><Firefly mood="proud" size={180} glow={glowColors} /></div>
                            <h1 className="font-display text-4xl md:text-5xl font-black text-cream mb-3 relative z-10">Radiant!</h1>
                            <p className="text-cream/60 text-lg mb-8 relative z-10">Ecla lit up the whole path for you today.</p>
                        </>
                    ) : (
                        /* Minimal celebration: clean checkmark + "Lesson complete" */
                        <>
                            <div className="mb-8 flex justify-center relative z-10">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-leaf/15 border-2 border-leaf/40">
                                    <CheckCircle2 className="h-12 w-12 text-leaf" />
                                </div>
                            </div>
                            <h1 className="font-display text-3xl md:text-4xl font-black text-cream mb-3 relative z-10">Lesson complete.</h1>
                            <p className="text-cream/60 text-lg mb-8 relative z-10">Here's how you did.</p>
                        </>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                        <div className={`rounded-card border ${intensity.glowEffects ? 'border-glow/30' : 'border-white/10'} bg-night-800/70 p-4`}>
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-1">Earned</p>
                            <p className={`font-display text-2xl font-bold ${intensity.glowEffects ? 'text-glow' : 'text-cream'}`}>+{xpEarned}</p>
                            <p className="text-xs text-cream/50">XP</p>
                        </div>
                        <div className="rounded-card border border-leaf/30 bg-night-800/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-1">Accuracy</p>
                            <p className="font-display text-2xl font-bold text-leaf">{total ? Math.round((correctCount / total) * 100) : 0}%</p>
                            <p className="text-xs text-cream/50">{correctCount}/{total}</p>
                        </div>
                        <div className="rounded-card border border-coral/30 bg-night-800/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-1">Hearts</p>
                            <p className="font-display text-2xl font-bold text-coral">{hearts}/5</p>
                            <p className="text-xs text-cream/50">remaining</p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/course')}
                        className="relative z-10 w-full py-4 rounded-xl bg-glow font-bold text-night-900 text-lg transition-all hover:bg-glow-bright flex items-center justify-center gap-2"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Continue Path'}
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </main>
    )
}