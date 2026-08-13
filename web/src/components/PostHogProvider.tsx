'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Prevent crash if the env variable is missing
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            console.warn('PostHog key is missing. Analytics will be disabled.')
            return
        }

        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
            capture_pageview: false, // We capture pageviews manually
            disable_session_recording: false, // Enable session recording for heatmaps
            person_profiles: 'identified_only', // Only create profiles for identified users
        })
    }, [])

    return (
        <PHProvider client={posthog}>
            <SuspendedPostHogPageView />
            {children}
        </PHProvider>
    )
}

function PostHogPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const ph = usePostHog()

    useEffect(() => {
        if (pathname && ph) {
            let url = window.origin + pathname
            if (searchParams.toString()) {
                url = url + `?${searchParams.toString()}`
            }
            ph.capture('$pageview', { '$current_url': url })
        }
    }, [pathname, searchParams, ph])

    return null
}

function SuspendedPostHogPageView() {
    return (
        <Suspense fallback={null}>
            <PostHogPageView />
        </Suspense>
    )
}