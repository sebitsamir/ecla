'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import SceneExperience from '@/components/ecla/SceneExperience'
import { sceneFor, applyLearnerName, personalizeScene } from '@/content/scenes'
import {
    fetchMemory, getLearnerName, recordCharacterEncounter,
    seedNameFromProfile, type LearnerMemory,
} from '@/lib/memory'
import { streetEncounter } from '@/content/scenes/streetEncounter'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function LearnPlayer() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const { user } = useUser()

    const [lesson, setLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [memory, setMemory] = useState<LearnerMemory | null>(null)
    const [finished, setFinished] = useState(false)
    const [evidence, setEvidence] = useState<{ correct: number; incorrect: number } | null>(null)
    const recordedSceneRef = useRef<string | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/lessons/${params.conceptId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                setLesson(data.lesson)
            } catch (e) {
                console.error('Failed to load lesson:', e)
            } finally {
                setLoading(false)
            }
        })()
    }, [getToken, params.conceptId])

    useEffect(() => {
        seedNameFromProfile(user?.firstName ?? null)
    }, [user])

    useEffect(() => {
        (async () => setMemory(await fetchMemory(getToken)))()
    }, [getToken])

    const baseScene = lesson?.code ? sceneFor(lesson.code, lesson) : undefined

    const storyExp = (lesson?.subLessons ?? []).find((s: any) => s.type === 'STORY')
    const retrievalTarget = (storyExp?.exercises ?? [])
        .filter((e: any) => e.answer)
        .map((e: any) => String(e.answer))

    const learned = ['CONTROLLED', 'TRANSFERRED', 'RETAINED'].includes(lesson?.mastery?.level ?? '')
    const learnerName = memory?.name ?? getLearnerName()

    const scene = useMemo(() => {
        let s = baseScene
            ? { ...baseScene, beats: applyLearnerName(baseScene.beats, learnerName) }
            : (learned && retrievalTarget.length > 0)
                ? streetEncounter({ name: learnerName, canDo: lesson?.canDo ?? '', expected: retrievalTarget })
                : undefined
        if (s) s = personalizeScene(s, memory)
        return s
    }, [baseScene, learnerName, learned, retrievalTarget, lesson?.canDo, memory])

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
        if (!loading && !lesson) {
            router.push('/course')
        } else if (!loading && lesson && !scene) {
            console.warn('[ecla] Redirecting: no scene for', JSON.stringify(lesson?.code))
            router.push('/course')
        }
    }, [loading, lesson, scene, router])

    const completeScene = async (correct: number, incorrect: number, sceneEvidence?: any) => {
        const token = await getToken()

        const exp = (lesson.subLessons ?? []).find((s: any) => s.type === 'STORY')
        await fetch(`${API_URL}/api/v1/lessons/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                conceptId: lesson.conceptId,
                subLessonId: exp?.id,
                mode: 'STORY',
                correctCount: correct,
                incorrectCount: incorrect,
                xpEarned: exp?.xpReward ?? lesson.xpReward ?? 20,
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
            }),
        })

        window.dispatchEvent(new Event('ecla:progress-updated'))
        setEvidence({ correct, incorrect })
        setFinished(true)
    }

    if (loading || !lesson || !scene) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B10]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-glow border-t-transparent mb-4" />
                <p className="text-sm text-cream/50">Preparing your experience…</p>
            </main>
        )
    }

    if (finished && evidence) {
        return (
            <main className="min-h-screen bg-[#0B0B10] flex items-center justify-center p-6 animate-fade-in">
                <div className="max-w-lg w-full text-center space-y-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-cream mb-2">You did it.</h1>
                        <p className="text-cream/60">{lesson.canDo}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13131B] p-6 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-4">
                            Communication achieved
                        </p>
                        <ul className="space-y-3">
                            {(scene.outcomes ?? []).map((outcome: string, i: number) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-leaf flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-cream/90">{outcome}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-glow/30 bg-glow/5 p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-glow mb-2">
                            Evidence
                        </p>
                        <p className="text-sm text-cream/80">
                            {evidence.correct} successful communications
                            {evidence.incorrect > 0 && `, ${evidence.incorrect} moments of repair`}
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/course')}
                        className="w-full py-4 rounded-xl bg-glow text-night-900 font-bold text-base inline-flex items-center justify-center gap-2 hover:bg-glow/90 transition-colors"
                    >
                        Continue your journey <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </main>
        )
    }

    const tools = {
        ...lesson.tools,
        scenePurpose: scene.purpose?.stakes,
        scenePatterns: scene.targetLanguage?.patterns,
    }

    return (
        <main className="min-h-screen font-body bg-[#0B0B10]">
            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B10]/95 backdrop-blur">
                <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/course')}
                        className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-cream transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Exit</span>
                    </button>
                    <p className="text-sm font-semibold text-cream/80 truncate">{scene.title}</p>
                    <p className="ml-auto text-[11px] uppercase tracking-widest text-cream/40">Spanish · Pre-A1</p>
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
