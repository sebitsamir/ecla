'use client'

import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function Home() {
  // useAuth gives us the client-side session state
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const [apiStatus, setApiStatus] = useState('Waiting for sign in...')

  useEffect(() => {
    // Don't run until Clerk has finished loading
    if (!isLoaded) return

    // If they aren't signed in, reset the status
    if (!isSignedIn) {
      setApiStatus('Waiting for sign in...')
      return
    }

    async function syncAndCheck() {
      setApiStatus('Syncing with API...')
      try {
        // 1. Get the Clerk JWT
        const token = await getToken()
        if (!token) throw new Error('No token')

        // 2. Call our protected Express API
        const res = await fetch('http://localhost:4000/api/v1/sync-user', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error(`API responded with ${res.status}`)

        const data = await res.json()

        if (data.synced) {
          setApiStatus(`Connected to DB! User ID: ${data.user.id.slice(0, 8)}...`)
        }
      } catch (e) {
        console.error(e)
        setApiStatus('Failed to connect to API. Is Express running on port 4000?')
      }
    }

    syncAndCheck()
  }, [isSignedIn, isLoaded, getToken])

  // Show a loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center text-zinc-500">
        Loading Fluenta...
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8 text-white">Fluenta</h1>

      {/* Standard JS conditional rendering replaces the deprecated SignedIn/SignedOut components */}
      {!isSignedIn ? (
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition font-medium">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition font-medium">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center gap-4">
          <UserButton />
          <p className="mt-4 text-emerald-400 text-lg font-semibold">Welcome to Fluenta.</p>
          <p className="text-zinc-400 text-sm bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 font-mono">
            API Status: {apiStatus}
          </p>
        </div>
      )}
    </main>
  )
}