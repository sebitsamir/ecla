'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

/** Wait for Clerk before API calls — prevents 401s on first paint. */
export function useAuthReady() {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    return { isLoaded, isSignedIn, getToken }
}

/** Refetch when lesson progress is saved elsewhere in the app. */
export function useProgressTick() {
    const [tick, setTick] = useState(0)
    useEffect(() => {
        const fn = () => setTick(t => t + 1)
        window.addEventListener('ecla:progress-updated', fn)
        return () => window.removeEventListener('ecla:progress-updated', fn)
    }, [])
    return tick
}
