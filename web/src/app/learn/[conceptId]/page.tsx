'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    Loader2, CheckCircle2, XCircle, ArrowRight,
    BookOpen, Zap, Music, GraduationCap, Sparkles, X
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type Exercise = {
    type: 'mcq' | 'fill_blank' | 'translate'
    prompt: string
    options?: string[]
    answer: string
    hint?: string
}

const getModeIcon = (mode: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
        STORY: BookOpen,
        DRILL: Zap,
        IMMERSION: Music,
        PROFESSIONAL: GraduationCap,
    }
    return icons[mode] ?? Zap
}

const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
        STORY: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        DRILL: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        IMMERSION: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        PROFESSIONAL: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    }
    return colors[mode] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'
}

export default function LearnPage() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()

    const [lesson, setLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Exercise State
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState<string>('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)
    const [incorrectCount, setIncorrectCount] = useState(0)
    const [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        async function fetchLesson() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/lessons/${params.conceptId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) throw new Error('Failed to load lesson')
                const data = await res.json()
                setLesson(data.lesson)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchLesson()
    }, [getToken, params.conceptId])

    const checkAnswer = (value: string) => {
        if (isRevealed || !value.trim()) return

        const exercises: Exercise[] = lesson.variant.exercises
        const currentExercise = exercises[currentIndex]

        // Normalize for comparison (trim whitespace, lowercase)
        const normalizedInput = value.trim().toLowerCase()
        const normalizedAnswer = currentExercise.answer.trim().toLowerCase()

        const correct = normalizedInput === normalizedAnswer
        setIsCorrect(correct)
        setIsRevealed(true)

        if (correct) {
            setCorrectCount(c => c + 1)
        } else {
            setIncorrectCount(c => c + 1)
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

            await fetch(`${API_URL}/api/v1/lessons/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conceptId: lesson.conceptId,
                    mode: lesson.mode,
                    correctCount,
                    incorrectCount,
                    xpEarned,
                }),
            })
        } catch (e) {
            console.error('Failed to save progress', e)
        } finally {
            setSaving(false)
        }
    }, [lesson, correctCount, incorrectCount, getToken])

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </main>
        )
    }

    if (!lesson) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
                <button onClick={() => router.push('/')} className="text-emerald-400 hover:underline">
                    Back to Dashboard
                </button>
            </main>
        )
    }

    const exercises: Exercise[] = lesson.variant.exercises
    const currentExercise = exercises[currentIndex]
    const progressPercent = ((currentIndex + (isRevealed ? 1 : 0)) / exercises.length) * 100

    const Icon = getModeIcon(lesson.mode)
    const modeColor = getModeColor(lesson.mode)

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header & Progress */}
            <header className="p-4 md:p-6 border-b border-zinc-800 flex items-center gap-4">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition"
                >
                    <X className="w-6 h-6 text-zinc-400" />
                </button>

                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full">

                {!isFinished ? (
                    <>
                        {/* Mode Flavor Text */}
                        {lesson.mode !== 'DRILL' && (lesson.variant.storyBeat || lesson.variant.culturalRef || lesson.variant.formalPhrase) && (
                            <div className={`w-full p-4 rounded-xl mb-8 border flex items-start gap-3 ${modeColor}`}>
                                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold mb-1 opacity-80">
                                        {lesson.mode === 'STORY' ? 'The Story' : lesson.mode === 'IMMERSION' ? 'Culture' : 'Professional'}
                                    </p>
                                    <p className="text-sm leading-relaxed italic">
                                        {lesson.variant.storyBeat || lesson.variant.culturalRef || lesson.variant.formalPhrase}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Question */}
                        <div className="w-full mb-8">
                            <p className="text-zinc-500 text-sm mb-2">
                                Question {currentIndex + 1} of {exercises.length}
                            </p>
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                {currentExercise.prompt}
                            </h2>
                            {currentExercise.hint && (
                                <p className="text-zinc-500 text-sm mt-2 italic">Hint: {currentExercise.hint}</p>
                            )}
                        </div>

                        {/* Dynamic Exercise Input */}
                        <div className="w-full mb-8 space-y-4">
                            {currentExercise.type === 'mcq' && (
                                <div className="space-y-3">
                                    {currentExercise.options?.map((option, i) => {
                                        const isCorrectOption = option === currentExercise.answer
                                        const isSelected = userInput === option

                                        let styles = 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                                        if (isRevealed) {
                                            if (isCorrectOption) styles = 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                                            else if (isSelected && !isCorrectOption) styles = 'border-rose-500 bg-rose-500/10 text-rose-100'
                                            else styles = 'border-zinc-800 opacity-50'
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => !isRevealed && checkAnswer(option)}
                                                disabled={isRevealed}
                                                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${styles}`}
                                            >
                                                <span className="font-medium">{option}</span>
                                                {isRevealed && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                                {isRevealed && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-rose-400" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {(currentExercise.type === 'fill_blank' || currentExercise.type === 'translate') && (
                                <>
                                    {currentExercise.type === 'fill_blank' ? (
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            disabled={isRevealed}
                                            className={`w-full p-4 rounded-xl border bg-zinc-900 text-white text-lg focus:outline-none transition disabled:opacity-70 ${isRevealed
                                                ? isCorrect ? 'border-emerald-500' : 'border-rose-500'
                                                : 'border-zinc-700 focus:border-emerald-500'
                                                }`}
                                            placeholder="Type your answer..."
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                                        />
                                    ) : (
                                        <textarea
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            disabled={isRevealed}
                                            className={`w-full p-4 rounded-xl border bg-zinc-900 text-white text-lg focus:outline-none transition disabled:opacity-70 min-h-[100px] ${isRevealed
                                                ? isCorrect ? 'border-emerald-500' : 'border-rose-500'
                                                : 'border-zinc-700 focus:border-emerald-500'
                                                }`}
                                            placeholder="Type the translation..."
                                            autoFocus
                                        />
                                    )}

                                    {!isRevealed && (
                                        <button
                                            onClick={() => checkAnswer(userInput)}
                                            disabled={!userInput.trim()}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-semibold transition-colors"
                                        >
                                            Check Answer
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Feedback & Next Button */}
                        {isRevealed && (
                            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {isCorrect ? (
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                        <p className="text-emerald-200 font-medium">Perfect! Keep going.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
                                        <p className="text-rose-200 text-sm mb-1">Incorrect.</p>
                                        <p className="text-rose-100 font-medium">
                                            Correct answer: <span className="font-bold">{currentExercise.answer}</span>
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleNext}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {currentIndex === exercises.length - 1 ? 'Finish Lesson' : 'Continue'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Completion Screen */
                    <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="inline-flex p-4 rounded-full bg-emerald-500/20 mb-4">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-bold">Lesson Complete!</h1>
                        <p className="text-zinc-400 text-lg">
                            You scored {correctCount} out of {exercises.length} and earned{' '}
                            <span className="text-emerald-400 font-bold">
                                {Math.round((correctCount / exercises.length) * (lesson.xpReward || 20))} XP
                            </span>
                        </p>

                        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/course')}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-colors"
                            >
                                Continue Learning
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                        {saving && <p className="text-zinc-500 text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving progress...</p>}
                    </div>
                )}
            </div>
        </main>
    )
}