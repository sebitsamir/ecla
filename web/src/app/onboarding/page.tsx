'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    Plane,
    Heart,
    Briefcase,
    Sparkles,
    BookOpen,
    Zap,
    Music,
    GraduationCap,
    Clock,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    Target,
    TrendingUp,
    Award,
} from 'lucide-react'
import posthog from 'posthog-js'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type ExperienceLevel = 'BEGINNER' | 'SOME_BASICS' | 'INTERMEDIATE_PLUS'

interface MotivationOption {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

interface ModeOption {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

interface GoalOption {
    xp: number
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

interface QuizQuestion {
    prompt: string
    options: string[]
    answer: string
}

const motivations: MotivationOption[] = [
    {
        id: 'TRAVEL',
        label: 'Travel',
        description: 'Navigate new countries with confidence',
        icon: Plane,
    },
    {
        id: 'HERITAGE',
        label: 'Family & Heritage',
        description: 'Connect with your roots and loved ones',
        icon: Heart,
    },
    {
        id: 'CAREER',
        label: 'Career',
        description: 'Unlock professional opportunities',
        icon: Briefcase,
    },
    {
        id: 'FUN',
        label: 'Personal Growth',
        description: 'Challenge yourself and have fun',
        icon: Sparkles,
    },
]

const modes: ModeOption[] = [
    {
        id: 'STORY',
        label: 'Story Mode',
        description: 'Learn through an immersive narrative',
        icon: BookOpen,
    },
    {
        id: 'DRILL',
        label: 'Drill Mode',
        description: 'Rapid-fire practice, zero fluff',
        icon: Zap,
    },
    {
        id: 'IMMERSION',
        label: 'Immersion Mode',
        description: 'Real culture, music, and native speech',
        icon: Music,
    },
    {
        id: 'PROFESSIONAL',
        label: 'Professional Mode',
        description: 'Formal register for work contexts',
        icon: GraduationCap,
    },
]

const dailyGoals: GoalOption[] = [
    {
        xp: 20,
        label: 'Casual',
        description: '5 minutes per day',
        icon: Clock,
    },
    {
        xp: 50,
        label: 'Consistent',
        description: '10 minutes per day',
        icon: TrendingUp,
    },
    {
        xp: 100,
        label: 'Intensive',
        description: '20+ minutes per day',
        icon: Target,
    },
]

const placementQuiz: QuizQuestion[] = [
    {
        prompt: '¿Cómo te llamas?',
        options: ['Me llamo Ana', 'Tengo hambre', 'Está lejos', 'Hay agua'],
        answer: 'Me llamo Ana',
    },
    {
        prompt: '¿Dónde está el baño?',
        options: ['Está cerca', 'Es rojo', 'Son las tres', 'Estoy cansado'],
        answer: 'Está cerca',
    },
    {
        prompt: 'Ayer ___ al cine.',
        options: ['fui', 'voy', 'iré', 'iría'],
        answer: 'fui',
    },
    {
        prompt: 'Si tuviera tiempo, ___ más español.',
        options: ['estudiaría', 'estudio', 'estudiaré', 'estudié'],
        answer: 'estudiaría',
    },
    {
        prompt: 'No creo que él ___ razón.',
        options: ['tenga', 'tiene', 'tuvo', 'tendrá'],
        answer: 'tenga',
    },
]

function calculateLevel(experience: ExperienceLevel, score: number): string {
    if (experience === 'BEGINNER') return 'A1'
    if (experience === 'SOME_BASICS') return score >= 3 ? 'A2' : 'A1'
    return score >= 3 ? 'B1' : 'A2'
}

export default function OnboardingPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, getToken } = useAuth()

    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [motivation, setMotivation] = useState('')
    const [preferredMode, setPreferredMode] = useState('')
    const [dailyGoalXp, setDailyGoalXp] = useState(50)

    const [experience, setExperience] = useState<ExperienceLevel | null>(null)
    const [showQuiz, setShowQuiz] = useState(false)
    const [quizIndex, setQuizIndex] = useState(0)
    const [quizScore, setQuizScore] = useState(0)
    const [currentLevel, setCurrentLevel] = useState('A1')

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/')
        }
    }, [isLoaded, isSignedIn, router])

    const selectMotivation = useCallback((value: string) => {
        setMotivation(value)
        setTimeout(() => setStep(2), 200)
    }, [])

    const selectMode = useCallback((value: string) => {
        setPreferredMode(value)
        setTimeout(() => setStep(3), 200)
    }, [])

    const selectExperience = useCallback((value: ExperienceLevel) => {
        setExperience(value)

        if (value === 'BEGINNER') {
            setShowQuiz(false)
            setCurrentLevel('A1')
            setTimeout(() => setStep(4), 200)
            return
        }

        setShowQuiz(true)
        setQuizIndex(0)
        setQuizScore(0)
    }, [])

    const answerQuiz = useCallback(
        (selectedAnswer: string) => {
            const isCorrect = placementQuiz[quizIndex].answer === selectedAnswer
            const nextScore = isCorrect ? quizScore + 1 : quizScore

            setQuizScore(nextScore)

            if (quizIndex < placementQuiz.length - 1) {
                setQuizIndex(quizIndex + 1)
                return
            }

            if (experience) {
                setCurrentLevel(calculateLevel(experience, nextScore))
            }

            setTimeout(() => setStep(4), 200)
        },
        [quizIndex, quizScore, experience]
    )

    const selectDailyGoal = useCallback((xp: number) => {
        setDailyGoalXp(xp)
        setTimeout(() => setStep(5), 200)
    }, [])

    const submitOnboarding = async () => {
        setSaving(true)
        setError('')

        try {
            const token = await getToken()
            if (!token) throw new Error('No auth token')

            const res = await fetch(`${API_URL}/api/v1/onboarding/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    motivation,
                    preferredMode,
                    dailyGoalXp,
                    currentLevel,
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || `API responded with ${res.status}`)
            }

            // Track successful onboarding completion
            posthog.capture('onboarding_completed', {
                motivation: motivation,
                preferred_mode: preferredMode,
                daily_goal_xp: dailyGoalXp,
                starting_level: currentLevel,
            })

            router.push('/')
            router.refresh()
        } catch (err) {
            console.error(err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not save your preferences. Please try again.'
            )
        } finally {
            setSaving(false)
        }
    }

    if (!isLoaded || !isSignedIn) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </main>
        )
    }

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map(dot => (
                <div
                    key={dot}
                    className={`h-1.5 rounded-full transition-all duration-300 ${step === dot
                            ? 'w-8 bg-emerald-500'
                            : step > dot
                                ? 'w-1.5 bg-emerald-600'
                                : 'w-1.5 bg-zinc-700'
                        }`}
                />
            ))}
        </div>
    )

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                <StepIndicator />

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-10 shadow-2xl">
                    {/* Step 1: Motivation */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                    Why are you learning Spanish?
                                </h1>
                                <p className="text-zinc-400">
                                    We&apos;ll personalize your entire learning path around your
                                    goal.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {motivations.map(item => {
                                    const Icon = item.icon
                                    const isSelected = motivation === item.id

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => selectMotivation(item.id)}
                                            className={`p-5 rounded-xl border text-left transition-all duration-200 group ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`p-3 rounded-lg transition-colors ${isSelected
                                                            ? 'bg-emerald-500/20'
                                                            : 'bg-zinc-800 group-hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    <Icon
                                                        className={`w-5 h-5 ${isSelected
                                                                ? 'text-emerald-400'
                                                                : 'text-zinc-400'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold mb-1">{item.label}</p>
                                                    <p className="text-sm text-zinc-400">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Mode Selection */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                    How do you learn best?
                                </h1>
                                <p className="text-zinc-400">
                                    All four modes use the same curriculum. Switch anytime without
                                    losing progress.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {modes.map(mode => {
                                    const Icon = mode.icon
                                    const isSelected = preferredMode === mode.id

                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => selectMode(mode.id)}
                                            className={`p-5 rounded-xl border text-left transition-all duration-200 group ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`p-3 rounded-lg transition-colors ${isSelected
                                                            ? 'bg-emerald-500/20'
                                                            : 'bg-zinc-800 group-hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    <Icon
                                                        className={`w-5 h-5 ${isSelected
                                                                ? 'text-emerald-400'
                                                                : 'text-zinc-400'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold mb-1">{mode.label}</p>
                                                    <p className="text-sm text-zinc-400">
                                                        {mode.description}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                    )}

                    {/* Step 3: Level Assessment */}
                    {step === 3 && !showQuiz && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                    What&apos;s your current level?
                                </h1>
                                <p className="text-zinc-400">
                                    We&apos;ll place you at the right starting point. Complete
                                    beginners skip the quiz.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => selectExperience('BEGINNER')}
                                    className="w-full p-5 rounded-xl border border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all duration-200"
                                >
                                    <p className="font-semibold mb-1">Complete Beginner</p>
                                    <p className="text-sm text-zinc-400">
                                        I know nothing or only a few words
                                    </p>
                                </button>

                                <button
                                    onClick={() => selectExperience('SOME_BASICS')}
                                    className="w-full p-5 rounded-xl border border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all duration-200"
                                >
                                    <p className="font-semibold mb-1">Some Basics</p>
                                    <p className="text-sm text-zinc-400">
                                        I know a few phrases and common words
                                    </p>
                                </button>

                                <button
                                    onClick={() => selectExperience('INTERMEDIATE_PLUS')}
                                    className="w-full p-5 rounded-xl border border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all duration-200"
                                >
                                    <p className="font-semibold mb-1">Intermediate or Higher</p>
                                    <p className="text-sm text-zinc-400">
                                        I can hold a basic conversation
                                    </p>
                                </button>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                    )}

                    {/* Step 3: Placement Quiz */}
                    {step === 3 && showQuiz && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-zinc-500">
                                        Question {quizIndex + 1} of {placementQuiz.length}
                                    </p>
                                    <div className="flex gap-1">
                                        {placementQuiz.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 w-6 rounded-full ${i < quizIndex
                                                        ? 'bg-emerald-500'
                                                        : i === quizIndex
                                                            ? 'bg-emerald-600'
                                                            : 'bg-zinc-700'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold mb-6">
                                    {placementQuiz[quizIndex].prompt}
                                </h1>
                            </div>

                            <div className="space-y-3">
                                {placementQuiz[quizIndex].options.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => answerQuiz(option)}
                                        className="w-full p-4 rounded-xl border border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-left transition-all duration-200 font-medium"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowQuiz(false)}
                                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                    )}

                    {/* Step 4: Daily Goal */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                    How much time can you commit?
                                </h1>
                                <p className="text-zinc-400">
                                    This sets your daily XP goal. Consistency beats intensity.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {dailyGoals.map(goal => {
                                    const Icon = goal.icon
                                    const isSelected = dailyGoalXp === goal.xp

                                    return (
                                        <button
                                            key={goal.xp}
                                            onClick={() => selectDailyGoal(goal.xp)}
                                            className={`p-5 rounded-xl border text-center transition-all duration-200 group ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                                                }`}
                                        >
                                            <div
                                                className={`inline-flex p-3 rounded-lg mb-3 transition-colors ${isSelected
                                                        ? 'bg-emerald-500/20'
                                                        : 'bg-zinc-800 group-hover:bg-zinc-700'
                                                    }`}
                                            >
                                                <Icon
                                                    className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'
                                                        }`}
                                                />
                                            </div>
                                            <p className="font-semibold mb-1">{goal.label}</p>
                                            <p className="text-sm text-zinc-400">
                                                {goal.description}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-2">
                                                {goal.xp} XP/day
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => setStep(3)}
                                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                    )}

                    {/* Step 5: Review & Submit */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <Award className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold">
                                        Your learning path is ready
                                    </h1>
                                </div>
                                <p className="text-zinc-400">
                                    Review your preferences. You can change these anytime in
                                    settings.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Goal</p>
                                        <p className="font-semibold">
                                            {motivations.find(m => m.id === motivation)?.label ??
                                                'Not selected'}
                                        </p>
                                    </div>
                                    {(() => {
                                        const found = motivations.find(m => m.id === motivation)
                                        if (!found) return null
                                        const Icon = found.icon
                                        return <Icon className="w-5 h-5 text-zinc-500" />
                                    })()}
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Learning Mode</p>
                                        <p className="font-semibold">
                                            {modes.find(m => m.id === preferredMode)?.label ??
                                                'Not selected'}
                                        </p>
                                    </div>
                                    {(() => {
                                        const found = modes.find(m => m.id === preferredMode)
                                        if (!found) return null
                                        const Icon = found.icon
                                        return <Icon className="w-5 h-5 text-zinc-500" />
                                    })()}
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Starting Level</p>
                                        <p className="font-semibold">{currentLevel}</p>
                                    </div>
                                    <GraduationCap className="w-5 h-5 text-zinc-500" />
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Daily Goal</p>
                                        <p className="font-semibold">{dailyGoalXp} XP/day</p>
                                    </div>
                                    <Target className="w-5 h-5 text-zinc-500" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                    <p className="text-sm text-rose-400">{error}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    onClick={() => setStep(4)}
                                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>

                                <button
                                    onClick={submitOnboarding}
                                    disabled={saving}
                                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Setting up...
                                        </>
                                    ) : (
                                        <>
                                            Start Learning
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}