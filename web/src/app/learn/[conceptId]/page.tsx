'use client'

/**
 * ECLA Learn Page — Scene-driven language experiences (Phase 11.3).
 *
 * The learner enters a situation and participates in it — not completing
 * exercises inside a website. Characters remember the learner. The world
 * reacts naturally. Evidence replaces points.
 *
 * Three entry paths:
 * 1. Authored scene → personalized reunion greeting
 * 2. Learned competency + no scene → street encounter (spaced retrieval)
 * 3. Neither → redirect to course page (shouldn't happen)
 *
 * Phase 11.3: Mode-aware routing ensures authored scenes only play when
 * ?mode is absent or STORY; other modes (DRILL, IMMERSION) don't force
 * the cinematic scene and instead redirect gracefully.
 */

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Check, ArrowRight } from 'lucide-react'
import SceneExperience from '@/components/ecla/SceneExperience'
import { sceneFor } from '@/content/scenes'
import { fetchMemory, recordEncounter, type LearnerMemory } from '@/lib/memory'
import { personalizeScene } from '@/content/scenes/personalize'
import { streetEncounter } from '@/content/scenes/streetEncounter'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function LearnPlayer() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const modeParam = searchParams.get('mode')
    const { getToken } = useAuth()

    const [lesson, setLesson] = useState<any>(null)
    const [memory, setMemory] = useState<LearnerMemory | null>(null)
    const [loading, setLoading] = useState(true)
    const [finished, setFinished] = useState(false)
    const [evidence, setEvidence] = useState<{ correct: number; incorrect: number } | null>(null)
    const recordedSceneRef = useRef<string | null>(null)

    // Fetch lesson data
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

    // Load learner memory (for personalization)
    useEffect(() => {
        (async () => setMemory(await fetchMemory(getToken)))()
    }, [getToken])

    // ── Phase 11.3: Mode-aware scene routing ──
    // Authored scenes are STORY experiences. If the adaptive engine routes
    // with a different mode (e.g., ?mode=DRILL), we don't force the cinematic scene.
    const sceneModeOk = !modeParam || modeParam === 'STORY'

    const storyExp = (lesson?.subLessons ?? []).find((s: any) => s.type === 'STORY')
    const retrievalTarget = (storyExp?.exercises ?? [])
        .filter((e: any) => e.answer)
        .map((e: any) => String(e.answer))

    const learned = ['CONTROLLED', 'TRANSFERRED', 'RETAINED'].includes(lesson?.mastery?.level ?? '')
    const baseScene = sceneModeOk ? sceneFor(lesson?.code) : undefined

    const scene = baseScene
        ? personalizeScene(baseScene, memory)
        : (learned && retrievalTarget.length)
            ? streetEncounter({ name: memory?.name, canDo: lesson?.canDo ?? '', expected: retrievalTarget })
            : undefined

    // Record character encounters for memory
    useEffect(() => {
        if (!scene || recordedSceneRef.current === scene.id) return
        recordedSceneRef.current = scene.id
        const chars = Array.from(new Set(
            scene.beats
                .filter(b => b.kind === 'say' || b.kind === 'listen' || b.kind === 'unexpected')
                .map(b => (b as any).character as string)
        ))
        chars.forEach(c => recordEncounter(getToken, c))
    }, [scene, getToken])

    // Scene completion handler
    const completeScene = async (correct: number, incorrect: number) => {
        const exp = (lesson.subLessons ?? []).find((s: any) => s.type === 'STORY')
        const token = await getToken()
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
        window.dispatchEvent(new Event('ecla:progress-updated'))
        window.dispatchEvent(new Event('luma:progress-updated'))
        setEvidence({ correct, incorrect })
        setFinished(true)
    }

    // Loading state
    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#0B0B10]">
                <p className="text-sm text-cream/50">Entering the scene…</p>
            </main>
        )
    }

    // Lesson not found
    if (!lesson) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#0B0B10]">
                <p className="text-sm text-cream/60">Lesson not found.</p>
            </main>
        )
    }

    // No scene available (shouldn't happen, but handle gracefully)
    if (!scene) {
        router.push('/course')
        return null
    }

    // Evidence-based completion screen
    if (finished && evidence) {
        return (
            <main className="min-h-screen bg-[#0B0B10] flex items-center justify-center p-6">
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
                            {scene.outcomes.map((outcome, i) => (
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

    // Active scene experience
    return (
        <main className="min-h-screen font-body bg-[#0B0B10]">
            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B10]/90 backdrop-blur">
                <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/course')}
                        className="text-sm text-cream/60 hover:text-cream transition-colors"
                    >
                        ← Exit
                    </button>
                    <p className="text-sm font-semibold text-cream/80 truncate">{lesson.conceptName}</p>
                    <p className="ml-auto text-[11px] uppercase tracking-widest text-cream/40">
                        Spanish · Pre-A1
                    </p>
                </div>
            </header>
            <SceneExperience
                scene={scene}
                tools={lesson.tools}
                mastery={lesson.mastery}
                getToken={getToken}
                onComplete={completeScene}
            />
        </main>
    )
}

export default function LearnPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-[#0B0B10]" />}>
            <LearnPlayer />
        </Suspense>
    )
}