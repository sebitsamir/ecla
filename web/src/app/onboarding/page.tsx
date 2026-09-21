'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, ArrowRight, Briefcase, Check, Clock3,
    Heart, Plane, ShieldCheck, Sparkles, Target, TrendingUp,
} from 'lucide-react'
import posthog from 'posthog-js'
import { Logo } from '@/components/BrandLogo'
import ApiState from '@/components/ApiState'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch, ApiError } from '@/lib/apiClient'

type ExperienceLevel = 'BEGINNER' | 'SOME_BASICS' | 'INTERMEDIATE_PLUS'
type IconType = ComponentType<{ className?: string }>

type MotivationOption = {
    id: 'TRAVEL' | 'HERITAGE' | 'CAREER' | 'FUN'
    label: string
    description: string
    icon: IconType
    defaultMode: ModeId
}

type ModeId = 'STORY' | 'DRILL' | 'IMMERSION' | 'PROFESSIONAL'
type GoalOption = { xp: 20 | 50 | 100; label: string; description: string; icon: IconType }

const MOTIVATIONS: MotivationOption[] = [
    { id: 'TRAVEL', label: 'Travel', description: 'Move through new places with more confidence.', icon: Plane, defaultMode: 'IMMERSION' },
    { id: 'HERITAGE', label: 'Family and heritage', description: 'Connect more deeply with people you love.', icon: Heart, defaultMode: 'STORY' },
    { id: 'CAREER', label: 'Work and study', description: 'Use Spanish in purposeful professional situations.', icon: Briefcase, defaultMode: 'PROFESSIONAL' },
    { id: 'FUN', label: 'Personal growth', description: 'Open a wider world one conversation at a time.', icon: Sparkles, defaultMode: 'DRILL' },
]

const EXPERIENCES: Array<{ id: ExperienceLevel; label: string; description: string }> = [
    { id: 'BEGINNER', label: 'This is my first Spanish', description: 'Begin gently, with clear context and generous support.' },
    { id: 'SOME_BASICS', label: 'I know a few useful phrases', description: 'Meet familiar language, then let support fade from observed success.' },
    { id: 'INTERMEDIATE_PLUS', label: 'I have used Spanish before', description: 'Start from the same evidence-safe path and open harder actions as soon as performance supports them.' },
]

const DAILY_GOALS: GoalOption[] = [
    { xp: 20, label: 'Gentle', description: 'About 5 minutes', icon: Clock3 },
    { xp: 50, label: 'Steady', description: 'About 10 minutes', icon: TrendingUp },
    { xp: 100, label: 'Deep', description: '20 minutes or more', icon: Target },
]

const STEP_IMAGES = [
    '/worlds/spanish-morning-v1.webp',
    '/worlds/spanish-evening-v2.webp',
    '/worlds/spanish-day-v1.webp',
    '/worlds/spanish-cafe-scene-v1.webp',
] as const

function SelectionMark({ selected }: { selected: boolean }) {
    return <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-ember bg-ember text-obsidian' : 'border-line-strong text-transparent'}`}><Check className="size-3.5" /></span>
}

export default function OnboardingPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const [step, setStep] = useState(1)
    const [checkingStatus, setCheckingStatus] = useState(true)
    const [statusError, setStatusError] = useState<ApiError | null>(null)
    const [statusVersion, setStatusVersion] = useState(0)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<ApiError | null>(null)
    const [motivation, setMotivation] = useState<MotivationOption['id'] | null>(null)
    const [experience, setExperience] = useState<ExperienceLevel | null>(null)
    const [preferredMode, setPreferredMode] = useState<ModeId>('STORY')
    const [dailyGoalXp, setDailyGoalXp] = useState<GoalOption['xp']>(50)

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return
        let cancelled = false
        apiFetch<{ onboardingCompleted?: boolean }>('/api/v1/users/me', getToken)
            .then(user => {
                if (cancelled) return
                if (user.onboardingCompleted) router.replace('/dashboard')
                else setCheckingStatus(false)
            })
            .catch(reason => {
                if (cancelled) return
                setStatusError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not prepare your setup.'))
                setCheckingStatus(false)
            })
        return () => { cancelled = true }
    }, [getToken, isLoaded, isSignedIn, router, statusVersion])

    const chooseMotivation = (option: MotivationOption) => {
        setMotivation(option.id)
        setPreferredMode(option.defaultMode)
    }

    const submitOnboarding = async () => {
        if (!motivation || !experience || saving) return
        setSaving(true)
        setSaveError(null)
        try {
            await apiFetch('/api/v1/onboarding/complete', getToken, {
                method: 'POST',
                body: JSON.stringify({ motivation, preferredMode, dailyGoalXp }),
            })
            posthog.capture('onboarding_completed', {
                motivation,
                preferred_mode: preferredMode,
                daily_goal_xp: dailyGoalXp,
                starting_preference: experience,
            })

            let destination = '/dashboard'
            try {
                const adaptive = await apiFetch<{ next?: { href?: string } }>('/api/v1/adaptive/next', getToken)
                if (adaptive.next?.href?.startsWith('/')) destination = adaptive.next.href
            } catch { /* The dashboard remains a safe fallback after preferences are saved. */ }
            router.replace(destination)
            router.refresh()
        } catch (reason) {
            setSaveError(reason instanceof ApiError ? reason : new ApiError('network', 'We could not save your setup.'))
            setSaving(false)
        }
    }

    if (!isLoaded || (isSignedIn && checkingStatus && !statusError)) {
        return <main className="flex min-h-dvh items-center justify-center bg-obsidian p-6 text-ivory" role="status"><div className="text-center"><span className="ecla-loading-mark mx-auto block text-ember-soft" /><h1 className="font-display mt-5 text-2xl">Preparing your first Spanish moment…</h1><p className="mt-2 text-sm text-stone">Restoring your place securely.</p></div></main>
    }

    if (!isSignedIn) {
        return <main className="flex min-h-dvh items-center justify-center bg-obsidian p-6"><div className="w-full max-w-xl"><ApiState error={new ApiError('unauthorized', 'Your session needs to be renewed.', 401)} /></div></main>
    }

    if (statusError) {
        return <main className="flex min-h-dvh items-center justify-center bg-obsidian p-6"><div className="w-full max-w-xl"><ApiState error={statusError} onRetry={() => { setStatusError(null); setCheckingStatus(true); setStatusVersion(value => value + 1) }} /><p className="mt-4 text-center text-xs text-ash">No preferences have been changed.</p></div></main>
    }

    const canContinue = step === 1 || (step === 2 && motivation) || (step === 3 && experience)

    return (
        <main className="relative min-h-dvh overflow-x-hidden bg-obsidian text-ivory">
            <Image src={STEP_IMAGES[step - 1]} alt="" fill priority sizes="100vw" className="fixed object-cover" />
            <div aria-hidden className="ecla-image-shade fixed inset-0" />

            <header className="ecla-dark-scene ecla-image-copy safe-top relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
                <Logo height={32} className="h-8 w-auto" />
                <p className="text-xs text-ivory/65">Step {step} of 4</p>
            </header>

            <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-[1440px] items-end px-4 pb-6 sm:px-6 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)] lg:items-center lg:gap-12 lg:px-10 lg:pb-10">
                <section className="ecla-dark-scene ecla-image-copy hidden max-w-xl pb-8 lg:block">
                    <p className="text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">Spanish · Pre-A1</p>
                    <h2 className="font-display mt-4 text-6xl leading-[.98]">A more human way to begin.</h2>
                    <p className="mt-5 max-w-md text-base leading-7 text-ivory/75">A few choices help Ecla shape the first encounter. Your ability will still be established by what you actually do.</p>
                </section>

                <section className="ecla-theme-panel min-w-0 overflow-hidden rounded-experience border border-line bg-ink/95 shadow-[0_28px_100px_rgba(0,0,0,.34)] backdrop-blur-xl">
                    <div className="h-1 bg-line"><div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${step * 25}%` }} /></div>
                    <div key={step} className="animate-fade-up p-5 sm:p-7 lg:p-8">
                        {step === 1 ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">Choose a language</p>
                                <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">Where do you want to begin?</h1>
                                <p className="mt-3 text-sm leading-6 text-stone">Spanish is the first complete Ecla journey available in this release.</p>
                                <div className="mt-7 flex min-h-20 items-center gap-4 rounded-surface border border-ember/40 bg-ember/10 p-4"><span className="text-2xl" aria-hidden>🇪🇸</span><div className="min-w-0 flex-1"><p className="font-medium text-ivory">Spanish</p><p className="mt-1 text-xs text-stone">Pre-A1 · real situations from the first scene</p></div><SelectionMark selected /></div>
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">Your reason</p>
                                <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">Why Spanish, now?</h1>
                                <p className="mt-3 text-sm leading-6 text-stone">This shapes the situations Ecla emphasizes. You can refine it later.</p>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    {MOTIVATIONS.map(option => { const Icon = option.icon; const selected = motivation === option.id; return <button key={option.id} onClick={() => chooseMotivation(option)} aria-pressed={selected} className={`ecla-control min-h-28 rounded-surface border p-4 text-left ${selected ? 'border-ember/45 bg-ember/10' : 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised'}`}><div className="flex items-start gap-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-ember text-obsidian' : 'bg-carbon text-stone'}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="font-medium text-ivory">{option.label}</p><p className="mt-1 text-xs leading-5 text-stone">{option.description}</p></div><SelectionMark selected={selected} /></div></button> })}
                                </div>
                            </div>
                        ) : null}

                        {step === 3 ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">Your starting point</p>
                                <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">How much can you already do?</h1>
                                <p className="mt-3 text-sm leading-6 text-stone">This helps set the tone of your first encounter. It does not award a level or skip evidence.</p>
                                <div className="mt-6 space-y-3">
                                    {EXPERIENCES.map(option => { const selected = experience === option.id; return <button key={option.id} onClick={() => setExperience(option.id)} aria-pressed={selected} className={`ecla-control flex min-h-20 w-full items-start gap-4 rounded-surface border p-4 text-left ${selected ? 'border-ember/45 bg-ember/10' : 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised'}`}><SelectionMark selected={selected} /><span className="min-w-0"><span className="block font-medium text-ivory">{option.label}</span><span className="mt-1 block text-xs leading-5 text-stone">{option.description}</span></span></button> })}
                                </div>
                                <p className="mt-5 flex items-start gap-2 rounded-control border border-line bg-surface p-3 text-xs leading-5 text-stone"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" /><span><strong className="font-medium text-ivory">Evidence-based Pre-A1 start.</strong> Placement and progression come from completed, server-scored situations.</span></p>
                            </div>
                        ) : null}

                        {step === 4 ? (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[.18em] text-ember-soft">Your rhythm</p>
                                <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">Choose a pace that fits real life.</h1>
                                <p className="mt-3 text-sm leading-6 text-stone">Ecla will choose the right kind of practice from your progress and the situation. You only need to decide how much time feels sustainable.</p>
                                <fieldset className="mt-7"><legend className="text-[10px] font-semibold uppercase tracking-[.16em] text-ash">Daily pace</legend><div className="mt-3 grid grid-cols-3 gap-2">{DAILY_GOALS.map(option => { const Icon = option.icon; const selected = dailyGoalXp === option.xp; return <button type="button" key={option.xp} onClick={() => setDailyGoalXp(option.xp)} aria-pressed={selected} className={`ecla-control min-w-0 rounded-control border px-2 py-4 text-center ${selected ? 'border-ember/45 bg-ember/10' : 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised'}`}><Icon className={`mx-auto size-5 ${selected ? 'text-ember-soft' : 'text-stone'}`} /><span className="mt-3 block truncate text-sm font-medium text-ivory">{option.label}</span><span className="mt-1 block text-[10px] leading-4 text-ash">{option.description}</span></button> })}</div></fieldset>
                                <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-stone"><Sparkles className="mt-0.5 size-4 shrink-0 text-ember-soft" />Your learning path adapts after every recorded scene. There is no mode to manage before you begin.</p>
                                {saveError ? <div className="mt-5"><ApiState error={saveError} onRetry={submitOnboarding} /></div> : null}
                            </div>
                        ) : null}

                        <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
                            {step > 1 ? <button onClick={() => { setSaveError(null); setStep(value => value - 1) }} disabled={saving} className="ecla-control flex min-h-11 items-center gap-2 rounded-control px-2 text-sm text-stone hover:text-ivory"><ArrowLeft className="size-4" />Back</button> : <span />}
                            {step < 4 ? <button onClick={() => setStep(value => value + 1)} disabled={!canContinue} className="ecla-control flex min-h-12 items-center gap-2 rounded-control bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft disabled:opacity-35">Continue <ArrowRight className="size-4" /></button> : <button onClick={submitOnboarding} disabled={saving || !motivation || !experience} className="ecla-control flex min-h-12 items-center gap-2 rounded-control bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft">{saving ? <><span className="ecla-loading-mark" />Preparing…</> : <>Begin first scene <ArrowRight className="size-4" /></>}</button>}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
