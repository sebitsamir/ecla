'use client'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuthReady } from '@/hooks/useAuthReady'
import { apiFetch } from '@/lib/apiClient'
import GoldenJourney from '@/components/golden/GoldenJourney'
import CanonicalJourney from '@/components/scenes/CanonicalJourney'
import AssessmentRunner from '@/components/assessment/AssessmentRunner'
import { BENCHMARK_CODES } from '../../../../../packages/contracts/golden'

function LearnPlayer() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
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
    if (error) return <main className="flex min-h-dvh items-center justify-center bg-obsidian p-6 text-ivory"><div className="ecla-surface w-full max-w-lg rounded-experience p-7"><p className="text-xs font-semibold uppercase tracking-[.18em] text-danger-soft">Scene unavailable</p><p role="alert" className="mt-3 text-stone">{error}</p><button className="ecla-control mt-6 min-h-11 rounded-control bg-ember px-5 font-semibold text-obsidian" onClick={exit}>Back to course</button></div></main>
    if (!code || !isLoaded || !isSignedIn) return <main className="flex min-h-dvh items-center justify-center bg-obsidian p-6 text-ivory" role="status"><div className="text-center"><span className="ecla-loading-mark mx-auto block text-ember-soft" /><p className="font-display mt-5 text-2xl">Preparing your scene…</p><p className="mt-2 text-sm text-stone">Restoring your place and conversation.</p></div></main>
    if (searchParams.get('mode') === 'MISSION') return <AssessmentRunner kind="mission" competencyId={competencyId} getToken={getToken} onExit={exit} />
    if ((BENCHMARK_CODES as readonly string[]).includes(code)) return <GoldenJourney key={competencyId} competencyCode={code} getToken={getToken} onExit={exit} />
    return <CanonicalJourney key={competencyId} competencyId={competencyId} getToken={getToken} onExit={exit} />
}
export default function LearnPage() { return <Suspense fallback={<main className="flex min-h-dvh items-center justify-center bg-obsidian text-stone" role="status">Preparing your scene…</main>}><LearnPlayer /></Suspense> }
