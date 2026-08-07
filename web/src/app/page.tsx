'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const modeLabels: Record<string, string> = {
  STORY: 'Story Mode',
  DRILL: 'Drill Mode',
  IMMERSION: 'Immersion Mode',
  PROFESSIONAL: 'Professional Mode',
}

const motivationLabels: Record<string, string> = {
  TRAVEL: 'Traveling soon',
  HERITAGE: 'Family / Heritage',
  CAREER: 'Career / Work',
  FUN: 'Just for fun',
}

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()

  const [screen, setScreen] = useState<'loading' | 'signedOut' | 'error' | 'dashboard'>('loading')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setScreen('signedOut')
      return
    }

    async function syncUser() {
      try {
        const token = await getToken()
        if (!token) throw new Error('No token')

        const res = await fetch(`${API_URL}/api/v1/sync-user`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error(`API responded with ${res.status}`)

        const data = await res.json()

        if (!data.onboardingCompleted) {
          router.push('/onboarding')
          return
        }

        setUser(data.user)
        setScreen('dashboard')
      } catch (error) {
        console.error(error)
        setScreen('error')
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, getToken, router])

  if (screen === 'loading') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading Fluenta...</p>
      </main>
    )
  }

  if (screen === 'signedOut') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-3">Fluenta</h1>
        <p className="text-zinc-400 mb-8">One curriculum. Four ways to learn.</p>

        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition font-medium">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="px-6 py-3 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition font-medium">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </main>
    )
  }

  if (screen === 'error') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
        <p className="text-zinc-400 mb-6">
          Could not connect to the Fluenta API. Make sure Express is running on port 4000.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition"
        >
          Retry
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold">Fluenta</h1>
          <UserButton />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <p className="text-zinc-400 text-sm mb-1">Continue Learning</p>
          <h2 className="text-2xl font-semibold mb-4">
            Your first concept is coming soon.
          </h2>

          <button
            disabled
            className="px-5 py-3 bg-emerald-600/50 text-white/60 rounded-lg cursor-not-allowed"
          >
            Start first concept
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm mb-2">Preferred Mode</p>
            <p className="font-semibold">
              {modeLabels[user?.preferredMode] ?? 'Not set'}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm mb-2">Motivation</p>
            <p className="font-semibold">
              {motivationLabels[user?.motivation] ?? 'Not set'}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm mb-2">Daily Goal</p>
            <p className="font-semibold">{user?.dailyGoalXp ?? 50} XP</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-sm mb-2">Level</p>
            <p className="font-semibold">{user?.currentLevel ?? 'A1'}</p>
          </div>
        </div>
      </div>
    </main>
  )
}