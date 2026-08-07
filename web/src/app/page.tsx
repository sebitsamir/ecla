'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import {BookOpen, Zap, Music, GraduationCap, Loader2, ArrowRight, AlertCircle, } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const modeLabels: Record<string, string> = {
  STORY: 'Story Mode',
  DRILL: 'Drill Mode',
  IMMERSION: 'Immersion Mode',
  PROFESSIONAL: 'Professional Mode',
}

const motivationLabels: Record<string, string> = {
  TRAVEL: 'Traveling soon',
  HERITAGE: 'Family & Heritage',
  CAREER: 'Career & Work',
  FUN: 'Personal Growth',
}

const getModeIcon = (mode: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    STORY: BookOpen,
    DRILL: Zap,
    IMMERSION: Music,
    PROFESSIONAL: GraduationCap,
  }
  return icons[mode] ?? BookOpen
}

type ScreenState = 'loading' | 'signedOut' | 'error' | 'dashboard'

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()

  const [screen, setScreen] = useState<ScreenState>('loading')
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [nextLesson, setNextLesson] = useState<Record<string, unknown> | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Sync user on auth state change
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setScreen('signedOut')
      return
    }

    async function syncUser() {
      try {
        const token = await getToken()
        if (!token) throw new Error('No authentication token')

        const res = await fetch(`${API_URL}/api/v1/sync-user`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `API error: ${res.status}`)
        }

        const data = await res.json()

        if (!data.onboardingCompleted) {
          router.push('/onboarding')
          return
        }

        setUser(data.user)
        setScreen('dashboard')
      } catch (err) {
        console.error('[Sync Error]', err)
        setErrorMessage(err instanceof Error ? err.message : 'Connection failed')
        setScreen('error')
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, getToken, router])

  // Fetch next lesson when dashboard is ready
  const fetchNextLesson = useCallback(async () => {
    if (screen !== 'dashboard') return

    try {
      setLoadingLesson(true)
      const token = await getToken()
      if (!token) return

      const res = await fetch(`${API_URL}/api/v1/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch lesson')

      const data = await res.json()
      setNextLesson(data.nextLesson)
    } catch (err) {
      console.error('[Lesson Fetch Error]', err)
    } finally {
      setLoadingLesson(false)
    }
  }, [screen, getToken])

  useEffect(() => {
    fetchNextLesson()
  }, [fetchNextLesson])

  // ─── Render States ─────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-zinc-400 text-sm">Loading Fluenta...</p>
        </div>
      </main>
    )
  }

  if (screen === 'signedOut') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Fluenta</h1>
        <p className="text-zinc-400 mb-8 text-center max-w-md">
          One curriculum. Four ways to learn. Switch modes anytime without losing progress.
        </p>

        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </main>
    )
  }

  if (screen === 'error') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex p-3 rounded-full bg-rose-500/10 mb-4">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-zinc-400 mb-6">{errorMessage || 'Could not reach the Fluenta API.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    )
  }

  // ─── Dashboard ─────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fluenta</h1>
          <UserButton />
        </div>

        {/* Continue Learning Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <p className="text-zinc-400 text-sm mb-4">Continue Learning</p>

          {loadingLesson ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
              <span className="text-zinc-500">Loading next concept...</span>
            </div>
          ) : nextLesson ? (
            <div>
              <div className="flex items-center gap-4 mb-4">
                {(() => {
                  const Icon = getModeIcon(nextLesson.mode as string)
                  return (
                    <div className="p-3 rounded-xl bg-emerald-500/10">
                      <Icon className="w-6 h-6 text-emerald-400" />
                    </div>
                  )
                })()}
                <div>
                  <h2 className="text-xl font-semibold">{nextLesson.conceptName as string}</h2>
                  <p className="text-sm text-zinc-400">
                    {modeLabels[nextLesson.mode as string]} ·{' '}
                    {(nextLesson.variant as { exercises?: unknown[] })?.exercises?.length ?? 0}{' '}
                    exercises
                  </p>
                </div>
              </div>

              {/* Mode-specific flavor text */}
              {(nextLesson.variant as { storyBeat?: string })?.storyBeat && (
                <p className="text-zinc-300 italic mb-4 text-sm leading-relaxed">
                  &ldquo;{(nextLesson.variant as { storyBeat?: string }).storyBeat}&rdquo;
                </p>
              )}
              {(nextLesson.variant as { culturalRef?: string })?.culturalRef && (
                <p className="text-zinc-300 italic mb-4 text-sm leading-relaxed">
                  &ldquo;{(nextLesson.variant as { culturalRef?: string }).culturalRef}&rdquo;
                </p>
              )}
              {(nextLesson.variant as { formalPhrase?: string })?.formalPhrase && (
                <p className="text-zinc-300 italic mb-4 text-sm leading-relaxed">
                  &ldquo;{(nextLesson.variant as { formalPhrase?: string }).formalPhrase}&rdquo;
                </p>
              )}

              <button
                onClick={() => router.push(`/learn/${nextLesson.conceptId}`)}
                className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                Start Lesson
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-zinc-500">No lessons available yet.</p>
              <p className="text-zinc-600 text-sm mt-1">Check back soon!</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Mode</p>
            <p className="font-semibold text-sm">
              {modeLabels[(user?.preferredMode as string) ?? ''] ?? 'Not set'}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Goal</p>
            <p className="font-semibold text-sm">
              {motivationLabels[(user?.motivation as string) ?? ''] ?? 'Not set'}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Daily Target</p>
            <p className="font-semibold text-sm">{(user?.dailyGoalXp as number) ?? 50} XP</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Level</p>
            <p className="font-semibold text-sm">{(user?.currentLevel as string) ?? 'A1'}</p>
          </div>
        </div>
      </div>
    </main>
  )
}