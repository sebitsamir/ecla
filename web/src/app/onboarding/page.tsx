'use client'

import { API_URL } from '@/lib/apiClient'

/**
 * /onboarding — New user setup flow (premium pass).
 * Motivation → Mode → Level → Goal → Review.
 * Auto-redirects if already completed or not authenticated.
 */
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    Plane, Heart, Briefcase, Sparkles, BookOpen, Zap, Music,
    GraduationCap, Clock, CheckCircle2, ArrowLeft, Loader2,
    Target, TrendingUp, Award, ArrowRight,
} from 'lucide-react'
import posthog from 'posthog-js'
import AppShell from '@/components/layout/AppShell'


type ExperienceLevel = 'BEGINNER' | 'SOME_BASICS' | 'INTERMEDIATE_PLUS'

interface MotivationOption {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    defaultMode?: string
}

interface ModeOption {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    accent: string
}

interface GoalOption {
    xp: number
    label: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const motivations: MotivationOption[] = [
    { id: 'TRAVEL', label: 'Travel', description: 'Navigate new countries with confidence', icon: Plane, defaultMode: 'IMMERSION' },
    { id: 'HERITAGE', label: 'Family & Heritage', description: 'Connect with your roots and loved ones', icon: Heart, defaultMode: 'STORY' },
    { id: 'CAREER', label: 'Career', description: 'Unlock professional opportunities', icon: Briefcase, defaultMode: 'PROFESSIONAL' },
    { id: 'FUN', label: 'Personal Growth', description: 'Challenge yourself and have fun', icon: Sparkles, defaultMode: 'DRILL' },
]

const modes: ModeOption[] = [
    { id: 'STORY', label: 'Story Mode', description: 'Learn through an immersive narrative', icon: BookOpen, accent: '#FFB45A' },
    { id: 'DRILL', label: 'Drill Mode', description: 'Rapid-fire practice, zero fluff', icon: Zap, accent: '#4DD8E6' },
    { id: 'IMMERSION', label: 'Immersion Mode', description: 'Real culture, music, and native speech', icon: Music, accent: '#B98CF0' },
    { id: 'PROFESSIONAL', label: 'Professional Mode', description: 'Formal register for work contexts', icon: GraduationCap, accent: '#7FA6FF' },
]

const dailyGoals: GoalOption[] = [
    { xp: 20, label: 'Casual', description: '5 minutes per day', icon: Clock },
    { xp: 50, label: 'Consistent', description: '10 minutes per day', icon: TrendingUp },
    { xp: 100, label: 'Intensive', description: '20+ minutes per day', icon: Target },
]

export default function OnboardingPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, getToken } = useAuth()

    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [checkingStatus, setCheckingStatus] = useState(true)

    const [motivation, setMotivation] = useState('')
    const [preferredMode, setPreferredMode] = useState('')
    const [dailyGoalXp, setDailyGoalXp] = useState(50)

    const [experience, setExperience] = useState<ExperienceLevel | null>(null)

    useEffect(() => {
        async function checkStatus() {
            if (!isLoaded) return
            if (!isSignedIn) {
                router.push('/')
                return
            }
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const user = await res.json()
                    if (user.onboardingComplete) {
                        router.push('/dashboard')
                        return
                    }
                }
            } catch (err) {
                console.error('Failed to check onboarding status:', err)
            }
            setCheckingStatus(false)
        }
        checkStatus()
    }, [isLoaded, isSignedIn, router, getToken])

    const selectMotivation = useCallback((value: string) => {
        setMotivation(value)
        const selectedMotivation = motivations.find(m => m.id === value)
        if (selectedMotivation?.defaultMode) {
            setPreferredMode(selectedMotivation.defaultMode)
        }
        setTimeout(() => setStep(2), 200)
    }, [])

    const selectMode = useCallback((value: string) => {
        setPreferredMode(value)
        setTimeout(() => setStep(3), 200)
    }, [])

    const selectExperience = useCallback((value: ExperienceLevel) => {
        setExperience(value)
        setTimeout(() => setStep(4), 200)
    }, [])

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
                }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || `API responded with ${res.status}`)
            }
            posthog.capture('onboarding_completed', {
                motivation: motivation,
                preferred_mode: preferredMode,
                daily_goal_xp: dailyGoalXp,
                starting_preference: experience,
            })
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

    if (!isLoaded || checkingStatus) {
        return (
            <AppShell>
                <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-glow border-t-transparent" />
                </div>
            </AppShell>
        )
    }

    if (!isSignedIn) {
        return null
    }

    const stepIndicator = (
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
        <AppShell>
            <div className="relative z-10 flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-2xl">
                    {stepIndicator}
                    <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6 sm:p-8 md:p-10">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                                        Why are you learning Spanish?
                                    </h1>
                                    <p className="text-cream/60">
                                        We&apos;ll personalize your entire learning path around your goal.
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
                                                className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 group active:scale-[0.98] ${
                                                    isSelected
                                                        ? 'border-glow/50 bg-glow/10'
                                                        : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div className={`p-2.5 sm:p-3 rounded-lg transition-colors ${isSelected ? 'bg-glow/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                                        <Icon className={`w-5 h-5 ${isSelected ? 'text-glow' : 'text-cream/60'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold mb-1">{item.label}</p>
                                                        <p className="text-xs sm:text-sm text-cream/50">{item.description}</p>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-glow flex-shrink-0" />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

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
                                        <p className="text-sm text-glow mt-2 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            We&apos;ve pre-selected Professional Mode based on your career goal.
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
                                                className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 group active:scale-[0.98] ${
                                                    isSelected
                                                        ? 'border-white/30 bg-white/[0.03]'
                                                        : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                                                }`}
                                                style={isSelected ? { borderColor: `${mode.accent}60` } : {}}
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div className="p-2.5 sm:p-3 rounded-lg transition-colors" style={{ backgroundColor: isSelected ? `${mode.accent}20` : 'rgba(255,255,255,0.05)' }}>
                                                        <Icon className="w-5 h-5" style={{ color: isSelected ? mode.accent : 'rgba(244, 241, 234, 0.6)' }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold mb-1">{mode.label}</p>
                                                        <p className="text-xs sm:text-sm text-cream/50">{mode.description}</p>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: mode.accent }} />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors">
                                    <ArrowLeft className="w-4 w-4" /> Back
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                                        How much Spanish have you used?
                                    </h1>
                                    <p className="text-cream/60">
                                        This adjusts your first support level. Placement comes from completed, server-scored situations rather than a self-scored quiz.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {(['BEGINNER', 'SOME_BASICS', 'INTERMEDIATE_PLUS'] as ExperienceLevel[]).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => selectExperience(level)}
                                            aria-pressed={experience === level}
                                            className={`w-full p-4 sm:p-5 rounded-xl border hover:border-glow/50 hover:bg-glow/5 text-left transition-all duration-200 active:scale-[0.98] ${experience === level ? 'border-glow/50 bg-glow/5' : 'border-white/10'}`}
                                        >
                                            <p className="font-semibold mb-1">
                                                {level === 'BEGINNER' ? 'This is my first Spanish' : level === 'SOME_BASICS' ? 'I know a few useful phrases' : 'I have used Spanish before'}
                                            </p>
                                            <p className="text-xs sm:text-sm text-cream/50">
                                                {level === 'BEGINNER' ? 'Begin with maximum support and a calm first encounter.' : level === 'SOME_BASICS' ? 'Begin with familiar situations, then fade support from observed success.' : 'Start at Pre-A1 and let independent evidence open harder actions quickly.'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            </div>
                        )}

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
                                                className={`p-4 sm:p-5 rounded-xl border text-center transition-all duration-200 group active:scale-[0.98] ${
                                                    isSelected
                                                        ? 'border-glow/50 bg-glow/10'
                                                        : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <div className={`inline-flex p-2.5 sm:p-3 rounded-lg mb-3 transition-colors ${isSelected ? 'bg-glow/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                                    <Icon className={`w-5 h-5 ${isSelected ? 'text-glow' : 'text-cream/60'}`} />
                                                </div>
                                                <p className="font-semibold mb-1">{goal.label}</p>
                                                <p className="text-xs sm:text-sm text-cream/50">{goal.description}</p>
                                                <p className="text-xs text-cream/40 mt-2">{goal.xp} XP/day</p>
                                            </button>
                                        )
                                    })}
                                </div>
                                <button onClick={() => setStep(3)} className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors">
                                    <ArrowLeft className="w-4 w-4" /> Back
                                </button>
                            </div>
                        )}

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
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Goal</p>
                                            <p className="font-semibold truncate">{motivations.find(m => m.id === motivation)?.label ?? 'Not selected'}</p>
                                        </div>
                                        {(() => {
                                            const found = motivations.find(m => m.id === motivation)
                                            if (!found) return null
                                            const Icon = found.icon
                                            return <Icon className="w-5 h-5 text-cream/50 flex-shrink-0 ml-2" />
                                        })()}
                                    </div>
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Learning Mode</p>
                                            <p className="font-semibold truncate">{modes.find(m => m.id === preferredMode)?.label ?? 'Not selected'}</p>
                                        </div>
                                        {(() => {
                                            const found = modes.find(m => m.id === preferredMode)
                                            if (!found) return null
                                            const Icon = found.icon
                                            return <Icon className="w-5 h-5 text-cream/50 flex-shrink-0 ml-2" />
                                        })()}
                                    </div>
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-cream/50 mb-1">Placement</p>
                                            <p className="font-semibold">Evidence-based Pre-A1 start</p>
                                        </div>
                                        <GraduationCap className="w-5 h-5 text-cream/50 flex-shrink-0" />
                                    </div>
                                    <p className="rounded-xl border border-glow/20 bg-glow/5 p-4 text-sm leading-relaxed text-cream/65">After your first completed situation, ECLA will explain your placement and next actions from observed performance, support use, and context—not from this preference form.</p>
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
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
                                    <button onClick={() => setStep(4)} className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors">
                                        <ArrowLeft className="w-4 w-4" /> Back
                                    </button>
                                    <button
                                        onClick={submitOnboarding}
                                        disabled={saving}
                                        className="px-6 sm:px-8 py-3 bg-glow hover:bg-glow/90 rounded-xl font-bold text-night-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base active:scale-[0.98]"
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
        </AppShell>
    )
}
