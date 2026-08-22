'use client'

/**
 * Learn Page — ECLA Lesson Player (competency-based, "new plan")
 *
 * Aligned with the ECLA master spec:
 * - Competency first: the `canDo` statement is the visible goal, not a grammar title
 * - Form vs Function: answers graded by tolerant form layer (normalize/variants/typos)
 *   + AI functional judge (meaning communicated) — Arts. 11/16/18
 * - Evidence framing: celebration shows what was demonstrated, not just XP (Art. 24)
 * - Modes as delivery: STORY/DRILL/IMMERSION/PROFESSIONAL/MISSION experiences
 * - MISSION parts may have zero exercises → jump straight to the real-life task
 *
 * Contract consumed from GET /api/v1/lessons/:conceptId:
 *   lesson: { conceptId, conceptName, canDo, mode, xpReward, grammarNote,
 *             variant { storyBeat, culturalRef, formalPhrase },
 *             subLessons [{ id, title, icon, type, xpReward, teach[], exercises[], realLife }],
 *             completedSubLessonIds, equippedCosmetic }
 *
 * Writes evidence via POST /api/v1/lessons/complete
 * Requires: web/src/lib/grading.ts + POST /api/v1/lessons/grade (below)
 */

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    X, Heart, ArrowRight, CheckCircle2, XCircle, Sparkles,
    BookOpenCheck, Puzzle, Ear, Lightbulb, MessageCircle,
    BookOpen, Music, GraduationCap, Target, Loader2,
} from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import SpeakerButton from '@/components/SpeakerButton'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { gradeLocal } from '@/lib/grading'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type LessonPhase = 'teach' | 'practice' | 'use' | 'celebration'
type MatchItem = { id: string; a: string; b: string }

const TYPE_ICON: Record<string, any> = {
    'book-open': BookOpenCheck, 'ear': Ear, 'message-circle': MessageCircle,
    'puzzle': Puzzle, 'lightbulb': Lightbulb, 'sparkles': Sparkles,
}

const MODE_FLAVOR_ICON: Record<string, any> = {
    STORY: BookOpen, DRILL: Puzzle, IMMERSION: Music, PROFESSIONAL: GraduationCap, MISSION: Target,
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function LearnPageContent() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const modeParam = searchParams.get('mode')
    const partParam = searchParams.get('part')
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    // ── Lesson / part state ──
    const [lesson, setLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [subLessons, setSubLessons] = useState<any[]>([])
    const [activeSubId, setActiveSubId] = useState<string | null>(null)
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
    const [partNumber, setPartNumber] = useState(1)
    const [wasReview, setWasReview] = useState(false)
    const [earnedXp, setEarnedXp] = useState(0)

    // ── Exercise state ──
    const [phase, setPhase] = useState<LessonPhase>('teach')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [gradeMethod, setGradeMethod] = useState<string | null>(null)
    const [checking, setChecking] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)
    const [hearts, setHearts] = useState(5)
    const [showXpFloat, setShowXpFloat] = useState(false)
    const [shakeCard, setShakeCard] = useState(false)

    // ── Match exercise state ──
    const [matchPairs, setMatchPairs] = useState<MatchItem[]>([])
    const [shuffledB, setShuffledB] = useState<MatchItem[]>([])
    const [selectedA, setSelectedA] = useState<string | null>(null)
    const [selectedB, setSelectedB] = useState<string | null>(null)
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
    const [wrongPair, setWrongPair] = useState<{ a: string; b: string } | null>(null)

    const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const thinkingRef = useRef(false)

    /** Fetch lesson + experiences (new contract). */
    useEffect(() => {
        async function fetchLesson() {
            try {
                const token = await getToken()
                const url = `${API_URL}/api/v1/lessons/${params.conceptId}${modeParam ? `?mode=${modeParam}` : ''}`
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) throw new Error('Failed to load lesson')
                const data = await res.json()
                setLesson(data.lesson)

                const done = new Set<string>(data.lesson.completedSubLessonIds ?? [])
                setCompletedIds(done)

                const subs = data.lesson.subLessons ?? []
                setSubLessons(subs)

                // Pick the part: ?part= param, else first incomplete, else celebration
                const fromParam = partParam ? subs.find((s: any) => s.id === partParam) : undefined
                const active = fromParam ?? subs.find((s: any) => !done.has(s.id)) ?? null

                if (active) {
                    setActiveSubId(active.id)
                    setPartNumber(subs.indexOf(active) + 1)
                    setWasReview(done.has(active.id))
                    if (!active.teach?.length) setPhase('practice')
                } else {
                    setPhase('celebration')
                }
            } catch (e) { console.error(e) } finally { setLoading(false) }
        }
        fetchLesson()
    }, [getToken, params.conceptId, modeParam, partParam])

    const activeSub = subLessons.find(s => s.id === activeSubId) ?? null
    const exercises: any[] = activeSub?.exercises || []
    const currentExercise = exercises[currentIndex]
    const totalSubs = subLessons.length
    const totalExercises = exercises.length
    const allDone = totalSubs > 0 && subLessons.every(s => completedIds.has(s.id))

    const partProgress = totalExercises > 0
        ? ((currentIndex + (isRevealed ? 1 : 0)) / totalExercises) * 100
        : 0

    const partAccuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 100

    /** Reset per-exercise state when moving between exercises. */
    const resetExerciseState = () => {
        setCurrentIndex(0)
        setUserInput('')
        setIsRevealed(false)
        setIsCorrect(false)
        setGradeMethod(null)
        setCorrectCount(0)
        setHearts(5)
        setMatchPairs([]); setShuffledB([])
        setSelectedA(null); setSelectedB(null)
        setMatchedIds(new Set()); setWrongPair(null)
    }

    const startReview = (sub: any) => {
        resetExerciseState()
        setActiveSubId(sub.id)
        setPartNumber(subLessons.indexOf(sub) + 1)
        setWasReview(true)
        setEarnedXp(0)
        setPhase(sub.teach?.length ? 'teach' : 'practice')
    }

    /**
     * Apply a grading decision.
     * penalize=false is used when the functional judge is unreachable —
     * we never punish the learner for infrastructure failures.
     */
    function reveal(correct: boolean, method: string | null, penalize = true) {
        setIsCorrect(correct)
        setIsRevealed(true)
        setGradeMethod(correct ? method : null)
        if (correct) {
            setCorrectCount(c => c + 1)
            setShowXpFloat(true)
            if (floatTimer.current) clearTimeout(floatTimer.current)
            floatTimer.current = setTimeout(() => setShowXpFloat(false), 1400)
        } else if (penalize) {
            setHearts(h => Math.max(0, h - 1))
            setShakeCard(true)
            setTimeout(() => setShakeCard(false), 450)
        }
    }

    /**
     * Two-layer grading (Phase 3):
     * 1) FORM layer locally: exact → normalized → accept variants → bounded typos
     * 2) FUNCTION layer server-side: AI judge decides meaning for open answers
     */
    const checkAnswer = async (value: string) => {
        if (isRevealed || checking || !value?.trim()) return
        if (!currentExercise || currentExercise.type === 'match') return

        // MCQ / listen_choose: option identity is the whole test (+ accept variants)
        if (currentExercise.type === 'mcq' || currentExercise.type === 'listen_choose') {
            const v = value.trim()
            const ok = v === (currentExercise.answer ?? '').trim()
                || (currentExercise.accept ?? []).some((a: string) => a.trim() === v)
            reveal(ok, ok ? 'exact' : null)
            return
        }

        const local = gradeLocal(value, currentExercise)
        if (local.needsJudge) {
            setChecking(true)
            try {
                const token = await getToken()
                const r = await fetch(`${API_URL}/api/v1/lessons/grade`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        prompt: currentExercise.prompt,
                        answer: value,
                        expected: currentExercise.answer,
                        accept: currentExercise.accept ?? [],
                    }),
                })
                if (!r.ok) throw new Error('judge unavailable')
                const j = await r.json()
                reveal(j.correct === true, j.correct ? 'ai' : null)
            } catch {
                // Judge unreachable: don't punish the learner; count as miss without heart loss
                reveal(false, null, false)
            } finally {
                setChecking(false)
            }
            return
        }

        reveal(local.correct, local.correct ? local.method : null)
    }

    // ── Match exercise ──
    const initMatchExercise = (pairs: { a: string; b: string }[]) => {
        const items: MatchItem[] = (pairs ?? []).map((p, i) => ({ id: `pair-${i}`, a: p.a, b: p.b }))
        setMatchPairs(items)
        setShuffledB(shuffle(items))
        setMatchedIds(new Set())
        setSelectedA(null); setSelectedB(null); setWrongPair(null)
    }

    const handleMatchClick = (side: 'a' | 'b', id: string) => {
        if (matchedIds.has(id) || wrongPair) return
        const resolve = (aId: string, bId: string) => {
            if (aId === bId) {
                const newMatched = new Set([...matchedIds, aId])
                setMatchedIds(newMatched)
                setSelectedA(null); setSelectedB(null)
                if (newMatched.size === matchPairs.length) {
                    setTimeout(() => reveal(true, 'exact'), 400)
                }
            } else {
                setWrongPair({ a: aId, b: bId })
                setTimeout(() => { setWrongPair(null); setSelectedA(null); setSelectedB(null) }, 500)
            }
        }
        if (side === 'a') {
            if (selectedA === id) { setSelectedA(null); return }
            setSelectedA(id)
            if (selectedB) resolve(id, selectedB)
        } else {
            if (selectedB === id) { setSelectedB(null); return }
            setSelectedB(id)
            if (selectedA) resolve(selectedA, id)
        }
    }

    /** Complete THIS part and write evidence to the learner model. */
    const completePart = async () => {
        if (!lesson || !activeSub) return
        setSaving(true)
        const xp = wasReview ? 0 : activeSub.xpReward
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/lessons/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    conceptId: lesson.conceptId,
                    subLessonId: activeSub.id,
                    mode: lesson.mode,
                    correctCount,
                    incorrectCount: Math.max(0, totalExercises - correctCount),
                    xpEarned: xp,
                }),
            })
            if (res.ok) {
                setCompletedIds(prev => new Set([...prev, activeSub.id]))
                setEarnedXp(xp)
                window.dispatchEvent(new Event('luma:progress-updated'))
                window.dispatchEvent(new Event('ecla:progress-updated'))
            }
        } catch (e) { console.error('Network error saving progress:', e) }
        finally { setSaving(false); setPhase('celebration') }
    }

    const handleNext = () => {
        if (currentIndex < totalExercises - 1) {
            setCurrentIndex(i => i + 1)
            setUserInput('')
            setIsRevealed(false)
            setIsCorrect(false)
            setGradeMethod(null)
            setMatchPairs([]); setShuffledB([])
            setSelectedA(null); setSelectedB(null)
            setMatchedIds(new Set()); setWrongPair(null)
        } else if (activeSub?.realLife) {
            setPhase('use')
        } else {
            completePart()
        }
    }

    // ── Loading shell ──
    if (loading || !lesson) {
        return (
            <main className="flex min-h-screen items-center justify-center font-body">
                <NightBackground />
                <Firefly mood="thinking" size={100} glow={glowColors} />
            </main>
        )
    }

    const FlavorIcon = MODE_FLAVOR_ICON[lesson.mode] ?? Sparkles
    const flavorText = lesson.mode === 'STORY' ? lesson.variant?.storyBeat
        : lesson.mode === 'IMMERSION' ? lesson.variant?.culturalRef
        : lesson.mode === 'PROFESSIONAL' ? lesson.variant?.formalPhrase
        : null

    /** Render teach blocks (explain/example/vocab/tip/alphabet). */
    const renderTeachBlock = (block: any, i: number) => {
        switch (block.type) {
            case 'explain':
                return (
                    <div key={i} className="rounded-xl border border-white/5 bg-night-900/40 p-4 md:p-5">
                        <p className="text-sm md:text-base leading-relaxed text-cream/90">{block.text}</p>
                    </div>
                )
            case 'example':
                return (
                    <div key={i} className="rounded-xl border border-white/10 bg-night-900/60 p-4 md:p-5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-lg md:text-xl font-bold text-cream leading-snug flex-1">{block.es}</p>
                            <SpeakerButton text={block.es} lang="es-ES" size="md" />
                        </div>
                        {block.en && <p className="text-sm text-cream/60 italic">{block.en}</p>}
                    </div>
                )
            case 'vocab':
                return (
                    <div key={i} className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-2">Vocabulary</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(block.items ?? []).map((item: any, j: number) => (
                                <div key={j} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-night-900/60 p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display text-sm md:text-base font-bold text-cream truncate">{item.word}</p>
                                        <p className="text-xs text-cream/50 truncate">{item.translation}</p>
                                    </div>
                                    <SpeakerButton text={item.word} lang="es-ES" size="sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 'tip':
                return (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl border border-glow/20 bg-glow/5 p-3.5 md:p-4">
                        <Lightbulb className="h-4 w-4 text-glow flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-cream/80 leading-relaxed">{block.text}</p>
                    </div>
                )
            case 'alphabet':
                return (
                    <div key={i} className="rounded-xl border border-white/10 bg-night-900/60 p-4 md:p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-2">Pronunciation</p>
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-base md:text-lg font-bold text-cream flex-1">{block.text}</p>
                            <SpeakerButton text={block.text} lang="es-ES" size="md" />
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    /** Render the current exercise by type. */
    const renderExercise = () => {
        if (!currentExercise) return null

        switch (currentExercise.type) {
            case 'mcq':
            case 'listen_choose':
                return (
                    <>
                        {currentExercise.type === 'listen_choose' && (
                            <div className="mb-4 flex flex-col items-center gap-2">
                                <SpeakerButton text={currentExercise.audio} lang="es-ES" size="lg" />
                                <p className="text-center text-xs text-cream/50">Listen and pick what you hear</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            {(currentExercise.options || []).map((option: string, i: number) => {
                                const isCorrectOption = option === currentExercise.answer
                                const isSelected = userInput === option
                                let styles = 'border-white/10 bg-night-900/50 hover:border-white/25 hover:bg-night-900'
                                if (isRevealed) {
                                    if (isCorrectOption) styles = 'border-leaf/50 bg-leaf/10 text-leaf'
                                    else if (isSelected && !isCorrectOption) styles = 'border-coral/50 bg-coral/10 text-coral'
                                    else styles = 'border-white/5 bg-night-900/30 opacity-50'
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => !isRevealed && checkAnswer(option)}
                                        disabled={isRevealed}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between min-h-[52px] sm:min-h-[56px] ${styles}`}
                                    >
                                        <span className="text-sm font-medium flex-1">{option}</span>
                                        {isRevealed && isCorrectOption && <CheckCircle2 className="h-4 w-4 flex-shrink-0 ml-2" />}
                                        {isRevealed && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 flex-shrink-0 ml-2" />}
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )

            case 'fill_blank':
            case 'translate':
            case 'listen_type':
                return (
                    <>
                        {currentExercise.type === 'listen_type' && (
                            <div className="mb-4 flex flex-col items-center gap-2">
                                <SpeakerButton text={currentExercise.audio} lang="es-ES" size="lg" />
                                <p className="text-center text-xs text-cream/50">Type what you hear</p>
                            </div>
                        )}
                        <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            disabled={isRevealed || checking}
                            className={`w-full p-4 rounded-xl border-2 bg-night-900/50 text-cream text-base focus:outline-none transition-all min-h-[52px] sm:min-h-[56px] ${isRevealed
                                ? isCorrect ? 'border-leaf/50' : 'border-coral/50'
                                : 'border-white/10 focus:border-cream/40 focus:bg-night-900'
                                }`}
                            placeholder={currentExercise.type === 'fill_blank' ? 'Type your answer...' : currentExercise.type === 'translate' ? 'Type the translation...' : 'Type what you hear...'}
                            autoFocus
                            enterKeyHint="done"
                            onKeyDown={e => e.key === 'Enter' && !isRevealed && !checking && checkAnswer(userInput)}
                        />
                        {!isRevealed && (
                            <button
                                onClick={() => checkAnswer(userInput)}
                                disabled={!userInput.trim() || checking}
                                className="w-full py-3.5 rounded-xl font-bold text-sm bg-glow text-night-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-3 hover:bg-glow-bright flex items-center justify-center gap-2"
                            >
                                {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking meaning…</> : 'Check Answer'}
                            </button>
                        )}
                    </>
                )

            case 'match': {
                if (matchPairs.length === 0 && currentExercise.pairs) {
                    initMatchExercise(currentExercise.pairs)
                }
                const allMatched = matchPairs.length > 0 && matchedIds.size === matchPairs.length
                const tileStyles = (id: string, side: 'a' | 'b') => {
                    if (matchedIds.has(id)) return 'border-leaf/40 bg-leaf/10 text-leaf opacity-50 cursor-default'
                    if (wrongPair && ((side === 'a' && wrongPair.a === id) || (side === 'b' && wrongPair.b === id))) return 'border-coral bg-coral/20 text-coral'
                    if ((side === 'a' && selectedA === id) || (side === 'b' && selectedB === id)) return 'border-glow bg-glow/15 text-cream ring-2 ring-glow/30'
                    return 'border-white/10 bg-night-900/60 text-cream hover:border-white/25'
                }
                return (
                    <div className="space-y-3">
                        <p className="text-xs text-cream/50 text-center mb-3">
                            {selectedA || selectedB ? 'Now tap the matching translation' : 'Tap a word, then its match'}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
                            <div className="space-y-1.5 sm:space-y-2">
                                {matchPairs.map(pair => (
                                    <button
                                        key={`a-${pair.id}`}
                                        onClick={() => handleMatchClick('a', pair.id)}
                                        disabled={matchedIds.has(pair.id) || !!wrongPair || isRevealed}
                                        className={`w-full p-2.5 sm:p-3 rounded-lg border-2 text-left text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-[52px] ${tileStyles(pair.id, 'a')}`}
                                    >
                                        <span className="block truncate">{pair.a}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                                {shuffledB.map(pair => (
                                    <button
                                        key={`b-${pair.id}`}
                                        onClick={() => handleMatchClick('b', pair.id)}
                                        disabled={matchedIds.has(pair.id) || !!wrongPair || isRevealed}
                                        className={`w-full p-2.5 sm:p-3 rounded-lg border-2 text-left text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-[52px] ${tileStyles(pair.id, 'b')}`}
                                    >
                                        <span className="block truncate">{pair.b}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {allMatched && (
                            <div className="mt-4 rounded-lg border border-leaf/30 bg-leaf/10 p-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-leaf flex-shrink-0" />
                                <span className="text-sm font-medium text-leaf">All matched!</span>
                            </div>
                        )}
                    </div>
                )
            }

            default:
                return null
        }
    }

    return (
        <main className="min-h-screen font-body">
            <style>{`
                @keyframes xp-float { 0% { opacity: 0; transform: translateY(0) scale(.6); } 20% { opacity: 1; transform: translateY(-10px) scale(1.1); } 80% { opacity: 1; transform: translateY(-40px) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(.8); } }
                .xp-float { animation: xp-float 1.4s ease-out forwards; }
                @keyframes card-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
                .card-shake { animation: card-shake .4s ease-in-out; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fade-in .4s ease-out both; }
            `}</style>

            <NightBackground />

            {/* ── Header: exit, progress, part counter, hearts ── */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/80 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-3 md:px-4 h-14 md:h-16 flex items-center gap-2 sm:gap-3">
                    <button onClick={() => router.push('/course')} className="rounded-lg p-2 text-cream/60 hover:bg-night-800 hover:text-cream transition-colors flex-shrink-0">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative h-2.5 md:h-3">
                        <div className="absolute inset-0 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-glow transition-all ease-out duration-300"
                                style={{ width: `${Math.min(100, phase === 'celebration' ? 100 : partProgress)}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] md:text-xs font-bold text-cream/50 whitespace-nowrap flex-shrink-0">
                        Part {partNumber}/{totalSubs}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Heart key={i} className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-all duration-300 ${i < hearts ? 'fill-coral text-coral' : 'text-cream/15'}`} />
                        ))}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-3 md:px-4 py-4 md:py-8">

                {/* ── CELEBRATION (evidence-framed rest screen) ── */}
                {phase === 'celebration' ? (
                    <div className="py-6 md:py-12 text-center fade-in">
                        <div className="mb-6 flex justify-center">
                            <Firefly mood="proud" size={120} glow={glowColors} />
                        </div>

                        {!activeSub || allDone ? (
                            <>
                                <h1 className="font-display text-2xl md:text-3xl font-black text-cream mb-2">Competency demonstrated!</h1>
                                <p className="text-cream/60 text-sm md:text-base mb-2 max-w-md mx-auto">{lesson.canDo}</p>
                                <p className="text-cream/50 text-xs md:text-sm mb-6">All {totalSubs} parts finished. The next competency unlocks on your path.</p>
                            </>
                        ) : (
                            <>
                                <h1 className="font-display text-2xl md:text-3xl font-black text-cream mb-2">Part {partNumber} complete!</h1>
                                <p className="text-cream/60 text-sm md:text-base mb-2 max-w-md mx-auto">You practiced: {lesson.canDo}</p>
                                <p className="text-cream/50 text-xs md:text-sm mb-6">Take a rest — the next part will be waiting on your path.</p>
                            </>
                        )}

                        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 max-w-md mx-auto">
                            <div className="rounded-xl border border-glow/30 bg-night-800/70 p-3">
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5">Earned</p>
                                <p className="font-display text-xl md:text-2xl font-bold text-glow">+{earnedXp}</p>
                                <p className="text-[10px] md:text-xs text-cream/50">XP</p>
                            </div>
                            <div className="rounded-xl border border-leaf/30 bg-night-800/70 p-3">
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5">Accuracy</p>
                                <p className="font-display text-xl md:text-2xl font-bold text-leaf">{partAccuracy}%</p>
                                <p className="text-[10px] md:text-xs text-cream/50">this part</p>
                            </div>
                            <div className="rounded-xl border border-coral/30 bg-night-800/70 p-3">
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/40 mb-0.5">Hearts</p>
                                <p className="font-display text-xl md:text-2xl font-bold text-coral">{hearts}/5</p>
                                <p className="text-[10px] md:text-xs text-cream/50">left</p>
                            </div>
                        </div>

                        <div className="max-w-md mx-auto space-y-2">
                            <button
                                onClick={() => router.push('/course')}
                                disabled={saving}
                                className="w-full py-3.5 rounded-xl bg-glow font-bold text-night-900 text-sm md:text-base transition-all hover:bg-glow-bright flex items-center justify-center gap-2"
                            >
                                {saving ? 'Saving…' : 'Back to Path'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            {!activeSub && subLessons.length > 0 && (
                                <button
                                    onClick={() => startReview(subLessons[0])}
                                    className="w-full py-3 rounded-xl border border-white/10 bg-night-900/60 text-cream text-sm font-semibold transition-all hover:bg-night-900 hover:border-white/25"
                                >
                                    Practice a part (no XP)
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Part header + competency goal ── */}
                        {activeSub && (
                            <div className="mb-4 md:mb-6 fade-in">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center bg-glow text-night-900 flex-shrink-0">
                                        {(() => { const SubIcon = TYPE_ICON[activeSub.icon] ?? Sparkles; return <SubIcon className="h-3.5 w-3.5 md:h-4 md:w-4" /> })()}
                                    </div>
                                    <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-cream/40">
                                        Part {partNumber} of {totalSubs}{wasReview ? ' · Review' : ''} · {activeSub.type}
                                    </span>
                                </div>
                                <h1 className="font-display text-xl md:text-2xl font-black text-cream leading-tight">{activeSub.title}</h1>
                                {/* Competency-first: the visible goal is the ability, not the topic */}
                                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-glow/20 bg-glow/5 p-3 md:p-4">
                                    <Target className="h-4 w-4 text-glow flex-shrink-0 mt-0.5" />
                                    <p className="text-xs md:text-sm text-cream/80 leading-relaxed">
                                        <span className="font-bold text-glow">You're building this ability: </span>
                                        {lesson.canDo}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Mode flavor card ── */}
                        {flavorText && (
                            <div className="mb-4 rounded-xl border border-white/10 bg-night-900/50 p-3.5 md:p-4 fade-in">
                                <div className="flex items-start gap-2.5">
                                    <FlavorIcon className="h-4 w-4 text-cream/60 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cream/50 mb-1">
                                            {lesson.mode === 'STORY' ? 'Story so far' : lesson.mode === 'IMMERSION' ? 'Culture note' : lesson.mode === 'PROFESSIONAL' ? 'Professional context' : 'Context'}
                                        </p>
                                        <p className="text-xs md:text-sm text-cream/80 leading-relaxed">{flavorText}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TEACH ── */}
                        {phase === 'teach' && activeSub && (
                            <div className="space-y-3 fade-in">
                                <div className="flex items-center gap-2 text-glow text-[11px] md:text-xs font-bold uppercase tracking-wider mb-1">
                                    <BookOpenCheck className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    Understand
                                </div>
                                {(activeSub.teach ?? []).map((block: any, i: number) => renderTeachBlock(block, i))}
                                <button
                                    onClick={() => { setPhase('practice'); setCurrentIndex(0); setUserInput(''); setIsRevealed(false) }}
                                    className="w-full py-3.5 rounded-xl font-bold text-night-900 text-sm md:text-base transition-all hover:bg-glow-bright flex items-center justify-center gap-2 mt-4 bg-glow"
                                >
                                    Start Practice
                                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                            </div>
                        )}

                        {/* ── PRACTICE ── */}
                        {phase === 'practice' && activeSub && currentExercise && (
                            <div className={`relative ${shakeCard ? 'card-shake' : ''} fade-in`}>
                                <div className="flex items-center gap-2 text-drill text-[11px] md:text-xs font-bold uppercase tracking-wider mb-3">
                                    <Puzzle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    Practice
                                    <span className="text-cream/40 ml-auto">{currentIndex + 1} of {totalExercises}</span>
                                </div>

                                {showXpFloat && totalExercises > 0 && (
                                    <div className="pointer-events-none absolute left-1/2 -top-3 z-10 xp-float">
                                        <div className="inline-flex items-center gap-1 rounded-full bg-glow px-2.5 py-1 text-xs font-black text-night-900">
                                            <Sparkles className="h-3 w-3" /> +{Math.max(1, Math.round(activeSub.xpReward / totalExercises))} XP
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-xl border border-white/10 bg-night-800/70 p-4 md:p-6 backdrop-blur-sm relative overflow-hidden min-h-[320px] md:min-h-[380px] flex flex-col">
                                    <div className="absolute inset-x-0 top-0 h-1 bg-glow opacity-70" />
                                    <div className="flex-1">
                                        {(currentExercise.type === 'mcq' || currentExercise.type === 'fill_blank' || currentExercise.type === 'translate') && (
                                            <h2 className="font-display text-base md:text-lg font-bold text-cream leading-snug mb-4 md:mb-5">
                                                {currentExercise.prompt}
                                            </h2>
                                        )}
                                        {renderExercise()}
                                    </div>

                                    {/* Feedback: form vs function (Art. 11 — errors are data) */}
                                    {isRevealed && currentExercise.type !== 'match' && (
                                        <div className="mt-5 space-y-3">
                                            {isCorrect ? (
                                                <div className="rounded-lg border border-leaf/30 bg-leaf/10 p-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <CheckCircle2 className="h-5 w-5 text-leaf flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 space-y-1.5">
                                                            <p className="text-sm font-semibold text-leaf">
                                                                {['fuzzy', 'variant', 'ai'].includes(gradeMethod ?? '')
                                                                    ? 'Meaning communicated — that counts. Form polishes with practice.'
                                                                    : 'Correct.'}
                                                            </p>
                                                            {(currentExercise as any).whyExplanation && (
                                                                <p className="text-xs text-cream/80 leading-relaxed">
                                                                    <span className="font-semibold">Why:</span> {(currentExercise as any).whyExplanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-coral/30 bg-coral/10 p-3 space-y-2">
                                                    <div className="flex items-start gap-2.5">
                                                        <XCircle className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 space-y-1.5">
                                                            <p className="text-sm font-semibold text-coral">
                                                                {hearts > 0 || gradeMethod ? 'Not quite right.' : 'Not quite right.'}
                                                            </p>
                                                            <p className="text-xs text-cream/80">
                                                                <span className="font-semibold">Answer:</span> <span className="font-bold text-cream">{(currentExercise as any).answer}</span>
                                                            </p>
                                                            <p className="text-[11px] text-cream/50">Errors are data — this comes back in review.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={handleNext}
                                                className="w-full py-3.5 rounded-xl font-bold text-sm text-night-900 transition-all hover:bg-glow-bright flex items-center justify-center gap-2 bg-glow"
                                            >
                                                {currentIndex === totalExercises - 1 ? 'Finish Part' : 'Continue'}
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    {isRevealed && currentExercise.type === 'match' && (
                                        <div className="mt-4">
                                            <button
                                                onClick={handleNext}
                                                className="w-full py-3.5 rounded-xl font-bold text-sm text-night-900 transition-all hover:bg-glow-bright flex items-center justify-center gap-2 bg-glow"
                                            >
                                                {currentIndex === totalExercises - 1 ? 'Finish Part' : 'Continue'}
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── PRACTICE with zero exercises (MISSION parts) ── */}
                        {phase === 'practice' && activeSub && !currentExercise && (
                            <div className="fade-in">
                                <button
                                    onClick={() => (activeSub.realLife ? setPhase('use') : completePart())}
                                    className="w-full py-3.5 rounded-xl bg-glow font-bold text-night-900 text-sm md:text-base flex items-center justify-center gap-2"
                                >
                                    {activeSub.realLife ? 'Go to your mission' : 'Finish Part'}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* ── USE: real-life transfer task ── */}
                        {phase === 'use' && activeSub?.realLife && (
                            <div className="fade-in">
                                <div className="flex items-center gap-2 text-immersion text-[11px] md:text-xs font-bold uppercase tracking-wider mb-3">
                                    <MessageCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    Use it (optional)
                                </div>
                                <div className="rounded-xl border border-glow/30 bg-gradient-to-br from-night-800/80 to-night-900/80 p-4 md:p-6 backdrop-blur-sm">
                                    <div className="flex items-start gap-3 mb-5">
                                        <div className="flex-shrink-0"><Firefly mood="proud" size={56} glow={glowColors} /></div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-glow mb-1.5">Your mission</p>
                                            <p className="font-display text-base md:text-lg font-bold text-cream leading-snug">
                                                {activeSub.realLife.prompt}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <button
                                            onClick={() => router.push(`/chat?seed=${encodeURIComponent(activeSub.realLife!.chatSeed || '')}`)}
                                            className="w-full py-3 rounded-xl bg-pro text-night-900 font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Practice with Ecla
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={completePart}
                                            disabled={saving}
                                            className="w-full py-3 rounded-xl bg-glow text-night-900 text-sm font-bold transition-all hover:bg-glow-bright flex items-center justify-center gap-2"
                                        >
                                            {saving ? 'Saving…' : 'Finish Part'}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-cream/40 text-center mt-3">
                                        Chat is optional — finish now and rest if you prefer.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}

/** Suspense wrapper: useSearchParams requires it during static generation. */
export default function LearnPage() {
    return (
        <Suspense fallback={
            <main className="flex min-h-screen items-center justify-center font-body">
                <NightBackground />
                <Firefly mood="thinking" size={100} />
            </main>
        }>
            <LearnPageContent />
        </Suspense>
    )
}