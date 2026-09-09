'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AssessmentRunner from '@/components/assessment/AssessmentRunner'
import { useAuthReady } from '@/hooks/useAuthReady'

export default function GatewayPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, getToken } = useAuthReady()

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.replace('/')
    }, [isLoaded, isSignedIn, router])

    if (!isLoaded || !isSignedIn) {
        return <main className="flex min-h-dvh items-center justify-center bg-obsidian p-6 text-center text-ivory" role="status"><div><span className="ecla-loading-mark mx-auto block text-ember-soft" /><p className="font-display mt-5 text-2xl">Preparing Gateway…</p><p className="mt-2 text-sm text-stone">Checking your session and evidence record.</p></div></main>
    }

    return <AssessmentRunner kind="gateway" getToken={getToken} onExit={() => router.push('/course')} />
}
