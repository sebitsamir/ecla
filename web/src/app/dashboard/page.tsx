'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import {
  BookOpen, Zap, Music, GraduationCap, Loader2, ArrowRight,
  AlertCircle, Flame, Target, Sparkles, ChevronDown, AlertTriangle, RefreshCw, RotateCcw
} from 'lucide-react'
import posthog from 'posthog-js'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const modeConfig = {
  STORY: { label: 'Story', icon: BookOpen, color: 'text-blue-400' },
  DRILL: { label: 'Drill', icon: Zap, color: 'text-yellow-400' },
  IMMERSION: { label: 'Immersion', icon: Music, color: 'text-purple-400' },
  PROFESSIONAL: { label: 'Professional', icon: GraduationCap, color: 'text-emerald-400' },
}

type ScreenState = 'loading' | 'signedOut' | 'error' | 'dashboard'

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()

  const [screen, setScreen] = useState<ScreenState>('loading')
  const [dailyXp, setDailyXp] = useState(0)
  const [dailyGoalXp, setDailyGoalXp] = useState(50)
  const [streakDays, setStreakDays] = useState(0)
  const [preferredMode, setPreferredMode] = useState<keyof typeof modeConfig>('DRILL')
  const [nextLesson, setNextLesson] = useState<any>(null)
  const [loadingLesson, setLoadingLesson] = useState(true)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [reviewRequired, setReviewRequired] = useState(false)
  const [accuracy, setAccuracy] = useState(100)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingLesson(true)
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/v1/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      setDailyXp(data.dailyXp)
      setDailyGoalXp(data.dailyGoalXp)
      setStreakDays(data.streakDays)
      setPreferredMode(data.preferredMode)
      setNextLesson(data.nextLesson)
      setReviewRequired(data.reviewRequired)
      setAccuracy(data.accuracy)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLesson(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setScreen('signedOut'); return }

    async function syncUser() {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/v1/sync-user`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Sync failed')
        const data = await res.json()
        if (!data.onboardingCompleted) { router.push('/onboarding'); return }
        setScreen('dashboard')
      } catch (err) {
        setScreen('error')
      }
    }
    syncUser()
  }, [isLoaded, isSignedIn, getToken, router])

  useEffect(() => {
    if (screen !== 'dashboard') return

    void fetchDashboardData()

    posthog.capture('dashboard_viewed')

    const handleUpdate = () => void fetchDashboardData()

    // Listen for the shout from the Lesson Player
    window.addEventListener('ecla:progress-updated', handleUpdate)
    window.addEventListener('focus', handleUpdate)

    return () => {
      window.removeEventListener('ecla:progress-updated', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
    }
  }, [screen, fetchDashboardData])

  const switchMode = async (newMode: keyof typeof modeConfig) => {
    try {
      const token = await getToken()
      await fetch(`${API_URL}/api/v1/user/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: newMode }),
      })

      // Track the mode switch!
      posthog.capture('mode_switched', { new_mode: newMode })

      setPreferredMode(newMode)
      setShowModeMenu(false)
      void fetchDashboardData() // Reload to show the new mode's lesson variant
    } catch (err) {
      console.error(err)
    }
  }

  if (screen === 'loading') return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></main>
  if (screen === 'signedOut') return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-3 tracking-tight">ecla</h1>
      <p className="text-zinc-400 mb-8 text-center max-w-md">One curriculum. Four ways to learn.</p>
      <div className="flex gap-4">
        <SignInButton mode="modal"><button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors">Sign In</button></SignInButton>
        <SignUpButton mode="modal"><button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors">Get Started</button></SignUpButton>
      </div>
    </main>
  )
  if (screen === 'error') return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <AlertCircle className="w-8 h-8 text-rose-400 mb-4" />
      <p className="text-zinc-400 mb-6">Could not reach the API.</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-600 rounded-xl font-medium">Retry</button>
    </main>
  )

  const progressPercent = Math.min((dailyXp / dailyGoalXp) * 100, 100)
  const circumference = 2 * Math.PI * 40 // radius 40
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference
  const CurrentMode = modeConfig[preferredMode]

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ecla</h1>
          <UserButton />
        </div>

        {/* Stats Row: Streak & Daily Goal */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">Streak</p>
              <p className="text-2xl font-bold">{streakDays} <span className="text-sm text-zinc-500 font-normal">days</span></p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Daily Goal</p>
              <p className="text-2xl font-bold">{dailyXp} <span className="text-sm text-zinc-500 font-normal">/ {dailyGoalXp} XP</span></p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-500"
                />
              </svg>
              <Target className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Adaptive Difficulty Intervention */}
        {reviewRequired && nextLesson && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-amber-100">Review Required</h3>
                <p className="text-amber-200/80 text-sm mt-1 mb-4">
                  You scored {accuracy}% on <span className="font-semibold">{nextLesson.conceptName}</span>.
                  Let's solidify this before moving on. Try reviewing it in a different mode for a fresh perspective!
                </p>
                <button
                  onClick={() => router.push(`/learn/${nextLesson.conceptId}`)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Review Concept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-zinc-400 text-sm">Continue Learning</p>
          <div className="relative">
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg"
            >
              <CurrentMode.icon className={`w-4 h-4 ${CurrentMode.color}`} />
              {CurrentMode.label} Mode
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-10 py-1 animate-in fade-in zoom-in-95 duration-200">
                {Object.entries(modeConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={key}
                      onClick={() => switchMode(key as keyof typeof modeConfig)}
                      className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-zinc-800 transition-colors ${preferredMode === key ? 'bg-zinc-800' : ''}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link
            href="/review"
            className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <RotateCcw className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold">Review Flashcards</p>
              <p className="text-sm text-zinc-500">Spaced repetition</p>
            </div>
          </Link>

          <Link
            href="/course"
            className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">Course Map</p>
              <p className="text-sm text-zinc-500">View all concepts</p>
            </div>
          </Link>
          <Link
            href="/chat"
            className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold">AI Tutor</p>
              <p className="text-sm text-zinc-500">Chat in Spanish</p>
            </div>
          </Link>
        </div>

        {/* Next Lesson Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          {loadingLesson ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : nextLesson ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">{nextLesson.conceptName}</h2>

              {nextLesson.variant.storyBeat && <p className="text-zinc-300 italic mb-4 text-sm">&ldquo;{nextLesson.variant.storyBeat}&rdquo;</p>}
              {nextLesson.variant.culturalRef && <p className="text-zinc-300 italic mb-4 text-sm">&ldquo;{nextLesson.variant.culturalRef}&rdquo;</p>}
              {nextLesson.variant.formalPhrase && <p className="text-zinc-300 italic mb-4 text-sm">&ldquo;{nextLesson.variant.formalPhrase}&rdquo;</p>}

              <button
                onClick={() => router.push(`/learn/${nextLesson.conceptId}`)}
                className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                Start Lesson <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-zinc-500">No lessons available.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}