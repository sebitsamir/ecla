'use client'
import AppShell from '@/components/layout/AppShell'
import AssessmentRunner from '@/components/assessment/AssessmentRunner'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useRouter } from 'next/navigation'
export default function GatewayPage() {
    const router = useRouter(); const { isLoaded, isSignedIn, getToken } = useAuthReady()
    if (!isLoaded) return <p role="status">Loading…</p>
    if (!isSignedIn) { router.push('/'); return null }
    return <AppShell><AssessmentRunner kind="gateway" getToken={getToken} onExit={() => router.push('/course')} /></AppShell>
}
