'use client'

/**
 * Onboarding Page: New User Setup Flow
 * 
 * This page guides new users through initial setup after signup:
 * 1. Motivation selection (why they're learning Spanish)
 * 2. Learning mode preference (how they learn best)
 * 3. Level assessment (placement quiz or beginner)
 * 4. Daily goal setting (XP per day)
 * 5. Review and submit
 * 
 * Key Features:
 * - Auto-redirects to dashboard if user already completed onboarding
 * - Auto-redirects to login if not authenticated
 * - Smart mode pre-selection based on motivation
 * - Adaptive placement quiz (beginners skip it)
 * - Progress tracking with step indicator
 * - Persists preferences to backend and analytics
 * 
 * Architecture:
 * - Client-side form with 5 steps
 * - Validates auth state on mount
 * - Checks onboarding completion status via API
 * - Submits to POST /api/v1/onboarding/complete
 * - Redirects to dashboard on success
 * 
 * Critical Integration:
 * - Middleware or dashboard must redirect here if onboarding not complete
 * - User record must track `onboardingComplete` boolean
 * - Clerk auth provides JWT token for API calls
 * 
 * API Endpoints Used:
 * - GET /api/v1/users/me: Check if onboarding already completed
 * - POST /api/v1/onboarding/complete: Save preferences and mark complete
 */

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
    ArrowRight,
} from 'lucide-react'
import posthog from 'posthog-js'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/**
 * Experience level options for placement
 * BEGINNER: Skip quiz, start at A1
 * SOME_BASICS: Take quiz, A1 or A2 based on score
 * INTERMEDIATE_PLUS: Take quiz, A2 or B1 based on score
 */
type ExperienceLevel = 'BEGINNER' | 'SOME_BASICS' | 'INTERMEDIATE_PLUS'

/**
 * Motivation option structure
 * Each motivation has a default learning mode that gets auto-selected
 */
interface MotivationOption {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    defaultMode?: string
}

/**
 * Learning mode option structure
 * Each mode has a unique accent color for visual distinction
 */
interface ModeOption {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    accent: string
}

/**
 * Daily goal option structure
 * XP targets range from casual (20) to intensive (100)
 */
interface GoalOption {
    xp: number
    label: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

/**
 * Placement quiz question structure
 * Multiple choice with one correct answer
 */
interface QuizQuestion {
    prompt: string
    options: string[]
    answer: string
}

/**
 * Motivation options with smart mode defaults
 * Career → Professional, Travel → Immersion, etc.
 */
const motivations: MotivationOption[] = [
    {
        id: 'TRAVEL',
        label: 'Travel',
        description: 'Navigate new countries with confidence',
        icon: Plane,
        defaultMode: 'IMMERSION',
    },
    {
        id: 'HERITAGE',
        label: 'Family & Heritage',
        description: 'Connect with your roots and loved ones',
        icon: Heart,
        defaultMode: 'STORY',
    },
    {
        id: 'CAREER',
        label: 'Career',
        description: 'Unlock professional opportunities',
        icon: Briefcase,
        defaultMode: 'PROFESSIONAL',
    },
    {
        id: 'FUN',
        label: 'Personal Growth',
        description: 'Challenge yourself and have fun',
        icon: Sparkles,
        defaultMode: 'DRILL',
    },
]

/**
 * Learning mode options with unique visual identities
 */
const modes: ModeOption[] = [
    {
        id: 'STORY',
        label: 'Story Mode',
        description: 'Learn through an immersive narrative',
        icon: BookOpen,
        accent: '#FFB45A',
    },
    {
        id: 'DRILL',
        label: 'Drill Mode',
        description: 'Rapid-fire practice, zero fluff',
        icon: Zap,
        accent: '#4DD8E6',
    },
    {
        id: 'IMMERSION',
        label: 'Immersion Mode',
        description: 'Real culture, music, and native speech',
        icon: Music,
        accent: '#B98CF0',
    },
    {
        id: 'PROFESSIONAL',
        label: 'Professional Mode',
        description: 'Formal register for work contexts',
        icon: GraduationCap,
        accent: '#7FA6FF',
    },
]

/**
 * Daily XP goal options
 * Casual (20 XP) → Consistent (50 XP) → Intensive (100 XP)
 */
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

/**
 * Placement quiz questions
 * Tests grammar knowledge from A1 to B1 level
 * Score determines starting level:
 * - 0-2 correct: Lower level
 * - 3+ correct: Higher level
 */
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

/**
 * Calculate CEFR level based on experience and quiz score
 * 
 * @param experience - Self-reported experience level
 * @param score - Number of correct quiz answers (0-5)
 * @returns CEFR level string (A1, A2, or B1)
 */
function calculateLevel(experience: ExperienceLevel, score: number): string {
    if (experience === 'BEGINNER') return 'A1'
    if (experience === 'SOME_BASICS') return score >= 3 ? 'A2' : 'A1'
    return score >= 3 ? 'B1' : 'A2'
}

/**
 * Onboarding Page Component
 * 
 * Main component handling the entire onboarding flow.
 * 
 * State Management:
 * - step: Current step (1-5)
 * - saving: Tracks form submission in progress
 * - error: Error message to display
 * - motivation: Selected motivation ID
 * - preferredMode: Selected learning mode ID
 * - dailyGoalXp: Daily XP target
 * - experience: Self-reported experience level
 * - showQuiz: Whether to show placement quiz
 * - quizIndex: Current question index
 * - quizScore: Number of correct answers
 * - currentLevel: Calculated CEFR level
 * - checkingStatus: Initial auth/status check in progress
 * 
 * Critical Flow:
 * 1. Check auth status (redirect to login if not signed in)
 * 2. Check if onboarding already complete (redirect to dashboard if yes)
 * 3. Show onboarding flow
 * 4. Submit preferences to backend
 * 5. Redirect to dashboard
 */
export default function OnboardingPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, getToken } = useAuth()

    // ── Flow State ──
    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [checkingStatus, setCheckingStatus] = useState(true)

    // ── Form State ──
    const [motivation, setMotivation] = useState('')
    const [preferredMode, setPreferredMode] = useState('')
    const [dailyGoalXp, setDailyGoalXp] = useState(50)

    // ── Assessment State ──
    const [experience, setExperience] = useState<ExperienceLevel | null>(null)
    const [showQuiz, setShowQuiz] = useState(false)
    const [quizIndex, setQuizIndex] = useState(0)
    const [quizScore, setQuizScore] = useState(0)
    const [currentLevel, setCurrentLevel] = useState('A1')

    /**
     * Check authentication and onboarding status on mount
     * 
     * Critical checks:
     * 1. Is user signed in? If not → redirect to login
     * 2. Has user completed onboarding? If yes → redirect to dashboard
     * 
     * This prevents:
     * - Unauthenticated users accessing onboarding
     * - Users re-doing onboarding after completion
     */
    useEffect(() => {
        async function checkStatus() {
            if (!isLoaded) return

            // Not signed in → redirect to login
            if (!isSignedIn) {
                router.push('/')
                return
            }

            // Signed in → check if onboarding already complete
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                if (res.ok) {
                    const user = await res.json()
                    // If onboarding already complete, redirect to dashboard
                    if (user.onboardingComplete) {
                        router.push('/dashboard')
                        return
                    }
                }
            } catch (err) {
                console.error('Failed to check onboarding status:', err)
            }

            // User is signed in and hasn't completed onboarding → show flow
            setCheckingStatus(false)
        }

        checkStatus()
    }, [isLoaded, isSignedIn, router, getToken])

    /**
     * Select motivation and auto-choose default mode
     * Advances to step 2 after brief delay for smooth transition
     * 
     * @param value - Motivation ID
     */
    const selectMotivation = useCallback((value: string) => {
        setMotivation(value)
        // Auto-select the default mode for this motivation
        const selectedMotivation = motivations.find(m => m.id === value)
        if (selectedMotivation?.defaultMode) {
            setPreferredMode(selectedMotivation.defaultMode)
        }
        setTimeout(() => setStep(2), 200)
    }, [])

    /**
     * Select learning mode and advance to step 3
     * 
     * @param value - Mode ID
     */
    const selectMode = useCallback((value: string) => {
        setPreferredMode(value)
        setTimeout(() => setStep(3), 200)
    }, [])

    /**
     * Select experience level
     * 
     * Beginners skip the quiz and go straight to A1
     * Others take the placement quiz to determine level
     * 
     * @param value - Experience level
     */
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

    /**
     * Handle quiz answer selection
     * 
     * Tracks score and advances to next question
     * After final question, calculates level and advances to step 4
     * 
     * @param selectedAnswer - User's selected answer
     */
    const answerQuiz = useCallback(
        (selectedAnswer: string) => {
            const isCorrect = placementQuiz[quizIndex].answer === selectedAnswer
            const nextScore = isCorrect ? quizScore + 1 : quizScore

            setQuizScore(nextScore)

            if (quizIndex < placementQuiz.length - 1) {
                setQuizIndex(quizIndex + 1)
                return
            }

            // Quiz complete → calculate level
            if (experience) {
                setCurrentLevel(calculateLevel(experience, nextScore))
            }

            setTimeout(() => setStep(4), 200)
        },
        [quizIndex, quizScore, experience]
    )

    /**
     * Select daily XP goal and advance to step 5
     * 
     * @param xp - Daily XP target
     */
    const selectDailyGoal = useCallback((xp: number) => {
        setDailyGoalXp(xp)
        setTimeout(() => setStep(5), 200)
    }, [])

    /**
     * Submit onboarding data to backend
     * 
     * Sends all preferences to API:
     * - motivation
     * - preferredMode
     * - dailyGoalXp
     * - currentLevel
     * 
     * On success:
     * - Captures analytics event
     * - Redirects to dashboard
     * - Refreshes router cache
     * 
     * On failure:
     * - Shows error message
     * - User can retry
     */
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

            // Track completion in analytics
            posthog.capture('onboarding_completed', {
                motivation: motivation,
                preferred_mode: preferredMode,
                daily_goal_xp: dailyGoalXp,
                starting_level: currentLevel,
            })

            // Redirect to dashboard
            router.push('/dashboard')
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

    // ── Loading State: Checking auth and onboarding status ──
    if (!isLoaded || checkingStatus) {
        return (
            <main className="min-h-screen font-body">
                <NightBackground />
                <div className="flex min-h-screen items-center justify-center">
                    <Firefly mood="thinking" size={120} />
                </div>
            </main>
        )
    }

    // ── Not signed in: redirect handled in useEffect ──
    if (!isSignedIn) {
        return null
    }

    /**
     * Step indicator showing progress through onboarding
     * Active step is wider, completed steps are filled, future steps are dim
     */
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map(dot => (
                <div
                    key={dot}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === dot
                            ? 'w-8 bg-glow'
                            : step > dot
                            ? 'w-1.5 bg-glow/60'
                            : 'w-1.5 bg-white/20'
                    }`}
                />
            ))}
        </div>
    )

    return (
        <main className="min-h-screen font-body text-cream">
            <NightBackground />
            <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-2xl">
                    <StepIndicator />

                    <div className="rounded-2xl border border-white/10 bg-night-800/80 backdrop-blur-md p-6 sm:p-8 md:p-10 shadow-glow-md">
                        {/* ── Step 1: Motivation ─ */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                                        Why are you learning Spanish?
                                    </h1>
                                    <p className="text-cream/60">
                                        We'll personalize your entire learning path around your goal.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {motivations.map(item => {
                                        const Icon = item.icon
                                        const isSelected = motivation === item.id

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => selectMotivation(item.id)}
                                                className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 group ${
                                                    isSelected
                                                        ? 'border-glow/50 bg-glow/10'
                                                        : 'border-white/10 hover:border-white/25 hover:bg-night-900/60'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div
                                                        className={`p-2.5 sm:p-3 rounded-lg transition-colors ${
                                                            isSelected
                                                                ? 'bg-glow/20'
                                                                : 'bg-night-900/60 group-hover:bg-night-900'
                                                        }`}
                                                    >
                                                        <Icon
                                                            className={`w-5 h-5 ${
                                                                isSelected ? 'text-glow' : 'text-cream/60'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold mb-1">{item.label}</p>
                                                        <p className="text-xs sm:text-sm text-cream/50">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-5 h-5 text-glow flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Mode Selection ─ */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                                        How do you learn best?
                                    </h1>
                                    <p className="text-cream/60">
                                        All four modes use the same curriculum. Switch anytime without losing progress.
                                    </p>
                                    {motivation === 'CAREER' && preferredMode === 'PROFESSIONAL' && (
                                        <p className="text-sm text-pro mt-2 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            We've pre-selected Professional Mode based on your career goal.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {modes.map(mode => {
                                        const Icon = mode.icon
                                        const isSelected = preferredMode === mode.id

                                        return (
                                            <button
                                                key={mode.id}
                                                onClick={() => selectMode(mode.id)}
                                                className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 group ${
                                                    isSelected
                                                        ? 'border-white/30 bg-night-900'
                                                        : 'border-white/10 hover:border-white/25 hover:bg-night-900/60'
                                                }`}
                                                style={isSelected ? { borderColor: `${mode.accent}60`, boxShadow: `0 0 20px ${mode.accent}25` } : {}}
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div
                                                        className="p-2.5 sm:p-3 rounded-lg transition-colors"
                                                        style={{ 
                                                            backgroundColor: isSelected ? `${mode.accent}20` : 'rgba(8, 16, 32, 0.6)',
                                                        }}
                                                    >
                                                        <Icon
                                                            className="w-5 h-5"
                                                            style={{ color: isSelected ? mode.accent : 'rgba(244, 241, 234, 0.6)' }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold mb-1">{mode.label}</p>
                                                        <p className="text-xs sm:text-sm text-cream/50">
                                                            {mode.description}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 
                                                            className="w-5 h-5 flex-shrink-0" 
                                                            style={{ color: mode.accent }}
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors"
                                >
                                    <ArrowLeft className="w-4 w-4" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* ── Step 3: Level Assessment ─ */}
                        {step === 3 && !showQuiz && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                                        What's your current level?
                                    </h1>
                                    <p className="text-cream/60">
                                        We'll place you at the right starting point. Complete beginners skip the quiz.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => selectExperience('BEGINNER')}
                                        className="w-full p-4 sm:p-5 rounded-xl border border-white/10 hover:border-glow/50 hover:bg-glow/5 text-left transition-all duration-200"
                                    >
                                        <p className="font-semibold mb-1">Complete Beginner</p>
                                        <p className="text-xs sm:text-sm text-cream/50">
                                            I know nothing or only a few words
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => selectExperience('SOME_BASICS')}
                                        className="w-full p-4 sm:p-5 rounded-xl border border-white/10 hover:border-glow/50 hover:bg-glow/5 text-left transition-all duration-200"
                                    >
                                        <p className="font-semibold mb-1">Some Basics</p>
                                        <p className="text-xs sm:text-sm text-cream/50">
                                            I know a few phrases and common words
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => selectExperience('INTERMEDIATE_PLUS')}
                                        className="w-full p-4 sm:p-5 rounded-xl border border-white/10 hover:border-glow/50 hover:bg-glow/5 text-left transition-all duration-200"
                                    >
                                        <p className="font-semibold mb-1">Intermediate or Higher</p>
                                        <p className="text-xs sm:text-sm text-cream/50">
                                            I can hold a basic conversation
                                        </p>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors"
                                >
                                    <ArrowLeft className="w-4 w-4" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* ── Step 3: Placement Quiz ─ */}
                        {step === 3 && showQuiz && (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm text-cream/50">
                                            Question {quizIndex + 1} of {placementQuiz.length}
                                        </p>
                                        <div className="flex gap-1">
                                            {placementQuiz.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 w-6 rounded-full ${
                                                        i < quizIndex
                                                            ? 'bg-glow'
                                                            : i === quizIndex
                                                            ? 'bg-glow/60'
                                                            : 'bg-white/20'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-6">
                                        {placementQuiz[quizIndex].prompt}
                                    </h1>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    {placementQuiz[quizIndex].options.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => answerQuiz(option)}
                                            className="w-full p-3.5 sm:p-4 rounded-xl border border-white/10 hover:border-glow/50 hover:bg-glow/5 text-left transition-all duration-200 font-medium text-sm sm:text-base"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowQuiz(false)}
                                    className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors"
                                >
                                    <ArrowLeft className="w-4 w-4" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* ── Step 4: Daily Goal ─ */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                                        How much time can you commit?
                                    </h1>
                                    <p className="text-cream/60">
                                        This sets your daily XP goal. Consistency beats intensity.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {dailyGoals.map(goal => {
                                        const Icon = goal.icon
                                        const isSelected = dailyGoalXp === goal.xp

                                        return (
                                            <button
                                                key={goal.xp}
                                                onClick={() => selectDailyGoal(goal.xp)}
                                                className={`p-4 sm:p-5 rounded-xl border text-center transition-all duration-200 group ${
                                                    isSelected
                                                        ? 'border-glow/50 bg-glow/10'
                                                        : 'border-white/10 hover:border-white/25 hover:bg-night-900/60'
                                                }`}
                                            >
                                                <div
                                                    className={`inline-flex p-2.5 sm:p-3 rounded-lg mb-3 transition-colors ${
                                                        isSelected
                                                            ? 'bg-glow/20'
                                                            : 'bg-night-900/60 group-hover:bg-night-900'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`w-5 h-5 ${
                                                            isSelected ? 'text-glow' : 'text-cream/60'
                                                        }`}
                                                    />
                                                </div>
                                                <p className="font-semibold mb-1">{goal.label}</p>
                                                <p className="text-xs sm:text-sm text-cream/50">
                                                    {goal.description}
                                                </p>
                                                <p className="text-xs text-cream/40 mt-2">
                                                    {goal.xp} XP/day
                                                </p>
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => setStep(3)}
                                    className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors"
                                >
                                    <ArrowLeft className="w-4 w-4" />
                                    Back
                                </button>
                            </div>
                        )}

                        {/* ── Step 5: Review & Submit ─ */}
                        {step === 5 && (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-glow/20">
                                            <Award className="w-6 h-6 text-glow" />
                                        </div>
                                        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold">
                                            Your learning path is ready
                                        </h1>
                                    </div>
                                    <p className="text-cream/60">
                                        Review your preferences. You can change these anytime in settings.
                                    </p>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-night-900/60 border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Goal</p>
                                            <p className="font-semibold truncate">
                                                {motivations.find(m => m.id === motivation)?.label ??
                                                    'Not selected'}
                                            </p>
                                        </div>
                                        {(() => {
                                            const found = motivations.find(m => m.id === motivation)
                                            if (!found) return null
                                            const Icon = found.icon
                                            return <Icon className="w-5 h-5 text-cream/50 flex-shrink-0 ml-2" />
                                        })()}
                                    </div>

                                    <div className="p-3.5 sm:p-4 rounded-xl bg-night-900/60 border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Learning Mode</p>
                                            <p className="font-semibold truncate">
                                                {modes.find(m => m.id === preferredMode)?.label ??
                                                    'Not selected'}
                                            </p>
                                        </div>
                                        {(() => {
                                            const found = modes.find(m => m.id === preferredMode)
                                            if (!found) return null
                                            const Icon = found.icon
                                            return <Icon className="w-5 h-5 text-cream/50 flex-shrink-0 ml-2" />
                                        })()}
                                    </div>

                                    <div className="p-3.5 sm:p-4 rounded-xl bg-night-900/60 border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Starting Level</p>
                                            <p className="font-semibold">{currentLevel}</p>
                                        </div>
                                        <GraduationCap className="w-5 h-5 text-cream/50 flex-shrink-0" />
                                    </div>

                                    <div className="p-3.5 sm:p-4 rounded-xl bg-night-900/60 border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Daily Goal</p>
                                            <p className="font-semibold">{dailyGoalXp} XP/day</p>
                                        </div>
                                        <Target className="w-5 h-5 text-cream/50 flex-shrink-0" />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-coral/10 border border-coral/20">
                                        <p className="text-sm text-coral">{error}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors"
                                    >
                                        <ArrowLeft className="w-4 w-4" />
                                        Back
                                    </button>

                                    <button
                                        onClick={submitOnboarding}
                                        disabled={saving}
                                        className="px-6 sm:px-8 py-3 bg-glow hover:bg-glow-bright rounded-xl font-bold text-night-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Setting up...
                                            </>
                                        ) : (
                                            <>
                                                Start Learning
                                                <ArrowRight className="w-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}