'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import SceneExperience from '@/components/ecla/SceneExperience'
import MissionRunner from '@/components/MissionRunner'
import ModeAmbience from '@/components/ModeAmbience'
import { sceneFor, applyLearnerName, personalizeScene } from '@/content/scenes'
import {
    fetchMemory, getLearnerName, recordCharacterEncounter,
    seedNameFromProfile, type LearnerMemory,
} from '@/lib/memory'
import { streetEncounter } from '@/content/scenes/streetEncounter'
import { MODE_LABELS, MODE_PURPOSE, normalizeMode } from '@/lib/modeStages'
import { retrievalTargetsFromLesson } from '@/lib/retrievalTargets'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function LearnPlayer() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()
    const { user } = useUser()

    const mode = normalizeMode(searchParams.get('mode'))
    const isReview = searchParams.get('review') === '1'

    const [lesson, setLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [memory, setMemory] = useState<LearnerMemory | null>(null)
    const [completing, setCompleting] = useState(false)
    const recordedSceneRef = useRef<string | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const res = await fetch(
                    `${API_URL}/api/v1/lessons/${params.conceptId}?mode=${mode}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                )
                const data = await res.json()
                setLesson(data.lesson)
            } catch (e) {
                console.error('Failed to load lesson:', e)
            } finally {
                setLoading(false)
            }
        })()
    }, [getToken, params.conceptId, mode])

    useEffect(() => { seedNameFromProfile(user?.firstName ?? null) }, [user])
    useEffect(() => { (async () => setMemory(await fetchMemory(getToken)))() }, [getToken])

    const activeExp = useMemo(
        () => (lesson?.subLessons ?? []).find((s: any) => s.type === mode)
            ?? (lesson?.subLessons ?? []).find((s: any) => s.type === 'STORY'),
        [lesson, mode],
    )

    const baseScene = !isReview && mode !== 'MISSION' && lesson?.code
        ? sceneFor(lesson.code, lesson, mode)
        : undefined

    const retrievalTarget = lesson ? retrievalTargetsFromLesson(lesson, 'STORY') : []

    const learned = ['CONTROLLED', 'TRANSFERRED', 'RETAINED'].includes(lesson?.mastery?.level ?? '')
    const learnerName = memory?.name ?? getLearnerName()

    const scene = useMemo(() => {
        if (mode === 'MISSION') return undefined
        let s = baseScene
            ? { ...baseScene, beats: applyLearnerName(baseScene.beats, learnerName) }
            : (isReview || learned) && retrievalTarget.length > 0
                ? streetEncounter({
                    name: learnerName,
                    canDo: lesson?.canDo ?? '',
                    expected: retrievalTarget,
                })
                : undefined
        if (s) s = personalizeScene(s, memory)
        return s
    }, [baseScene, learnerName, isReview, learned, retrievalTarget, lesson?.canDo, memory, mode])

    useEffect(() => {
        if (!scene || recordedSceneRef.current === scene.id) return
        recordedSceneRef.current = scene.id
        const chars = Array.from(new Set(
            scene.beats
                .filter((b: any) => b.kind === 'say' || b.kind === 'listen' || b.kind === 'unexpected')
                .map((b: any) => b.character as string)
                .filter((c: string) => c && c !== 'you'),
        ))
        chars.forEach(c => recordCharacterEncounter(getToken, c, learnerName))
    }, [scene, getToken, learnerName])

    useEffect(() => {
        if (!loading && !lesson) router.push('/course')
        else if (!loading && lesson && mode !== 'MISSION' && !scene) {
            console.warn('[ecla] Redirecting: no scene for', JSON.stringify(lesson?.code))
            router.push('/course')
        }
    }, [loading, lesson, scene, router, mode])

    const completeScene = async (correct: number, incorrect: number, sceneEvidence?: any) => {
        if (completing) return
        setCompleting(true)
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/lessons/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    conceptId: lesson.conceptId,
                    subLessonId: activeExp?.id,
                    mode,
                    correctCount: correct,
                    incorrectCount: incorrect,
                    xpEarned: activeExp?.xpReward ?? lesson.xpReward ?? 20,
                    review: isReview,
                }),
            })

            await fetch(`${API_URL}/api/v1/learner/demonstrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    competencyId: lesson.conceptId,
                    correct,
                    incorrect,
                    evidence: sceneEvidence ?? null,
                    contextId: scene?.id ?? lesson.conceptId,
                    review: isReview,
                }),
            })

            window.dispatchEvent(new Event('ecla:progress-updated'))
            router.push(isReview ? '/dashboard' : '/course')
        } catch (e) {
            console.error('Completion failed:', e)
            setCompleting(false)
        }
    }

    if (loading || !lesson) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B10]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-glow border-t-transparent mb-4" />
                <p className="text-sm text-cream/50">Preparing your experience…</p>
            </main>
        )
    }

    if (mode === 'MISSION') {
        return (
            <main className="min-h-screen font-body bg-[#0B0B10] relative">
                <ModeAmbience mode="MISSION" />
                <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B10]/95 backdrop-blur">
                    <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-3">
                        <button onClick={() => router.push('/course')} className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-cream">
                            <ArrowLeft className="h-4 w-4" /><span>Exit</span>
                        </button>
                        <p className="text-sm font-semibold text-cream/80 truncate">{lesson.canDo}</p>
                        <p className="ml-auto text-[11px] uppercase tracking-widest text-violet-300">Mission</p>
                    </div>
                </header>
                <MissionRunner
                    competencyId={lesson.conceptId}
                    onClose={() => router.push('/course')}
                />
            </main>
        )
    }

    if (!scene) return null

    const tools = {
        ...lesson.tools,
        scenePurpose: isReview
            ? 'Someone you know wants to hear it again — no hints.'
            : (scene.purpose?.stakes ?? activeExp?.content?.modePurpose),
        scenePatterns: scene.targetLanguage?.patterns,
    }

    return (
        <main className="min-h-screen font-body bg-[#0B0B10] relative">
            <ModeAmbience mode={mode} />
            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B10]/95 backdrop-blur">
                <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.push(isReview ? '/dashboard' : '/course')}
                        className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-cream transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Exit</span>
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-cream/80 truncate">
                            {isReview ? 'A familiar face' : scene.title}
                        </p>
                        <p className="text-[10px] text-cream/40 truncate">{MODE_PURPOSE[mode]}</p>
                    </div>
                    <p className="ml-auto text-[11px] uppercase tracking-widest text-cream/40">
                        {MODE_LABELS[mode]} · Pre-A1
                    </p>
                </div>
            </header>
            <div className="relative z-0 mx-auto max-w-[1400px] px-4 py-6">
                <SceneExperience
                    scene={scene}
                    tools={tools}
                    mastery={lesson.mastery}
                    getToken={getToken}
                    onComplete={completeScene}
                />
            </div>
            {completing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B10]/80 backdrop-blur-sm">
                    <p className="text-sm text-cream/60">Saving your evidence…</p>
                </div>
            )}
        </main>
    )
}

export default function LearnPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center bg-[#0B0B10]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-glow border-t-transparent" />
            </main>
        }>
            <LearnPlayer />
        </Suspense>
    )
}
