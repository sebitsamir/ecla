'use client'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch } from '@/lib/apiClient'
import GoldenJourney from '@/components/golden/GoldenJourney'
import CanonicalJourney from '@/components/scenes/CanonicalJourney'
import { GOLDEN_CODE } from '../../../../../packages/contracts/golden'

function LearnPlayer() {
    const params = useParams()
    const router = useRouter()
    const { isLoaded, isSignedIn, getToken } = useAuthReady()
    const [code, setCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const competencyId = String(params.conceptId)
    useEffect(() => {
        if (!isLoaded) return
        if (!isSignedIn) { router.push('/'); return }
        let cancelled = false
        apiFetch<{ lesson: { code: string } }>(`/api/v1/lessons/${encodeURIComponent(competencyId)}?mode=STORY`, getToken)
            .then(response => { if (!cancelled) setCode(response.lesson.code) })
            .catch(reason => { if (!cancelled) setError(reason.message) })
        return () => { cancelled = true }
    }, [competencyId, getToken, isLoaded, isSignedIn, router])
    const exit = () => router.push('/course')
    if (error) return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream"><p role="alert">{error}</p><button onClick={exit}>Back to course</button></main>
    if (!code || !isLoaded || !isSignedIn) return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream" role="status">Loading scene…</main>
    if (code === GOLDEN_CODE) return <GoldenJourney key={competencyId} getToken={getToken} onExit={exit} />
    return <CanonicalJourney key={competencyId} competencyId={competencyId} getToken={getToken} onExit={exit} />
}
export default function LearnPage() { return <Suspense fallback={<p role="status">Loading…</p>}><LearnPlayer /></Suspense> }
