'use client'

/**
 * ECLA Learn Page — competency-based lesson player
 *
 * Phases: Encounter → Practice → Use → Celebration
 * Speaking-first: production exercises (`speak`) use the MIC as primary input;
 * the Whisper transcript is graded tolerantly (gradeLocal + functional judge).
 * Typing remains as an accessibility fallback ("Prefer typing?").
 */

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    X, Heart, ArrowRight, CheckCircle2, XCircle, Sparkles,
    BookOpenCheck, Puzzle, Ear, Lightbulb, MessageCircle,
    BookOpen, Music, GraduationCap, Target, Loader2,
    Mic, Square, Keyboard, Eye, EyeOff,
} from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import SpeakerButton from '@/components/SpeakerButton'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { gradeLocal } from '@/lib/grading'
import { cancelSpeech } from '@/lib/speech'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type LessonPhase = 'encounter' | 'practice' | 'use' | 'celebration'

const MODE_THEMES: Record<string, { color: string; icon: any; label: string; purpose: string }> = {
    STORY: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/5', icon: BookOpen, label: 'Story', purpose: 'Context & Meaning' },
    DRILL: { color: 'text-orange-400 border-orange-400/30 bg-orange-400/5', icon: Puzzle, label: 'Drill', purpose: 'Pattern & Automaticity' },
    IMMERSION: { color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', icon: Ear, label: 'Immersion', purpose: 'Ear & Spontaneous' },
    PROFESSIONAL: { color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', icon: GraduationCap, label: 'Professional', purpose: 'Polite & Purposeful' },
    MISSION: { color: 'text-purple-400 border-purple-400/30 bg-purple-400/5', icon: Target, label: 'Mission', purpose: 'Real-World Transfer' },
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
    const [phase, setPhase] = useState<LessonPhase>('encounter')
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
    const [showMeaning, setShowMeaning] = useState(false)

    // ── Speaking exercise state ──
    const [inputMode, setInputMode] = useState<'speak' | 'type'>('speak')
    const [speakState, setSpeakState] = useState<'idle' | 'recording' | 'processing'>('idle')
    const [heard, setHeard] = useState<string | null>(null)
    const [micError, setMicError] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Match state ──
    const [matchPairs, setMatchPairs] = useState<any[]>([])
    const [shuffledB, setShuffledB] = useState<any[]>([])
    const [selectedA, setSelectedA] = useState<string | null>(null)
    const [selectedB, setSelectedB] = useState<string | null>(null)
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
    const [wrongPair, setWrongPair] = useState<{ a: string; b: string } | null>(null)

    const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Fetch lesson ──
    useEffect(() => {
        async function fetchLesson() {
            try {
                const token = await getToken()
                const url = `${API_URL}/api/v1/lessons/${params.conceptId}${modeParam ? `?mode=${modeParam}` : ''}`
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) throw new Error('Failed to load')
                const data = await res.json()
                setLesson(data.lesson)
                const done = new Set<string>(data.lesson.completedSubLessonIds ?? [])
                setCompletedIds(done)
                const subs = data.lesson.subLessons ?? []
                setSubLessons(subs)
                const fromParam = partParam ? subs.find((s: any) => s.id === partParam) : undefined
                const active = fromParam ?? subs.find((s: any) => !done.has(s.id)) ?? null
                if (active) {
                    setActiveSubId(active.id)
                    setPartNumber(subs.indexOf(active) + 1)
                    setWasReview(done.has(active.id))
                    if (!active.exercises?.length && active.realLife) setPhase('use')
                    else if (!active.exercises?.length) setPhase('celebration')
                } else setPhase('celebration')
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
    const partProgress = totalExercises > 0 ? ((currentIndex + (isRevealed ? 1 : 0)) / totalExercises) * 100 : 0
    const partAccuracy = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 100
    const modeTheme = MODE_THEMES[activeSub?.type || lesson?.mode || 'STORY']

    function reveal(correct: boolean, method: string | null, penalize = true) {
        setIsCorrect(correct); setIsRevealed(true); setGradeMethod(correct ? method : null)
        if (correct) {
            setCorrectCount(c => c + 1); setShowXpFloat(true)
            if (floatTimer.current) clearTimeout(floatTimer.current)
            floatTimer.current = setTimeout(() => setShowXpFloat(false), 1400)
        } else if (penalize) {
            setHearts(h => Math.max(0, h - 1)); setShakeCard(true)
            setTimeout(() => setShakeCard(false), 450)
        }
    }

    /** Two-layer grading shared by typed AND spoken answers. */
    const checkAnswer = async (value: string) => {
        if (isRevealed || checking || !value?.trim()) return
        if (!currentExercise || currentExercise.type === 'match') return

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
                    body: JSON.stringify({ answer: value, expected: currentExercise.answer, accept: currentExercise.accept ?? [] }),
                })
                if (!r.ok) throw new Error('judge unavailable')
                const j = await r.json()
                reveal(j.correct === true, j.correct ? 'ai' : null)
            } catch { reveal(false, null, false) } finally { setChecking(false) }
            return
        }
        reveal(local.correct, local.correct ? local.method : null)
    }

    // ── SPEAKING: record → transcribe → grade ──
    const startSpeaking = async () => {
        cancelSpeech() // never record over Ecla's voice
        setHeard(null); setMicError(false)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const rec = new MediaRecorder(stream)
            mediaRecorderRef.current = rec
            chunksRef.current = []
            rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            rec.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setSpeakState('processing')
                try {
                    const token = await getToken()
                    const res = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type },
                        body: blob,
                    })
                    const data = await res.json()
                    const text = (data.text ?? '').trim()
                    setHeard(text || null)
                    setSpeakState('idle')
                    if (text) { setUserInput(text); checkAnswer(text) }
                } catch {
                    setSpeakState('idle'); setMicError(true)
                }
            }
            rec.start()
            setSpeakState('recording')
            // safety: auto-stop after 10s
            if (autoStopRef.current) clearTimeout(autoStopRef.current)
            autoStopRef.current = setTimeout(() => stopSpeaking(), 10000)
        } catch {
            setMicError(true)      // permission denied → offer typing fallback
            setSpeakState('idle')
        }
    }

    const stopSpeaking = () => {
        if (autoStopRef.current) clearTimeout(autoStopRef.current)
        const rec = mediaRecorderRef.current
        if (rec && rec.state === 'recording') rec.stop()
    }

    // ── Match exercise ──
    const initMatchExercise = (pairs: { a: string; b: string }[]) => {
        const items = (pairs ?? []).map((p, i) => ({ id: `pair-${i}`, a: p.a, b: p.b }))
        setMatchPairs(items); setShuffledB(shuffle(items)); setMatchedIds(new Set())
        setSelectedA(null); setSelectedB(null); setWrongPair(null)
    }

    const handleMatchClick = (side: 'a' | 'b', id: string) => {
        if (matchedIds.has(id) || wrongPair) return
        const resolve = (aId: string, bId: string) => {
            if (aId === bId) {
                const next = new Set([...matchedIds, aId]); setMatchedIds(next)
                setSelectedA(null); setSelectedB(null)
                if (next.size === matchPairs.length) setTimeout(() => reveal(true, 'exact'), 400)
            } else {
                setWrongPair({ a: aId, b: bId })
                setTimeout(() => { setWrongPair(null); setSelectedA(null); setSelectedB(null) }, 500)
            }
        }
        if (side === 'a') { if (selectedA === id) { setSelectedA(null); return }; setSelectedA(id); if (selectedB) resolve(id, selectedB) }
        else { if (selectedB === id) { setSelectedB(null); return }; setSelectedB(id); if (selectedA) resolve(selectedA, id) }
    }

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
                    conceptId: lesson.conceptId, subLessonId: activeSub.id, mode: lesson.mode,
                    correctCount, incorrectCount: Math.max(0, totalExercises - correctCount), xpEarned: xp,
                }),
            })
            if (res.ok) {
                setCompletedIds(prev => new Set([...prev, activeSub.id])); setEarnedXp(xp)
                window.dispatchEvent(new Event('ecla:progress-updated'))
                window.dispatchEvent(new Event('luma:progress-updated'))
            }
        } catch (e) { console.error(e) } finally { setSaving(false); setPhase('celebration') }
    }

    const handleNext = () => {
        if (currentIndex < totalExercises - 1) {
            setCurrentIndex(i => i + 1)
            setUserInput(''); setIsRevealed(false); setIsCorrect(false); setGradeMethod(null)
            setHeard(null); setSpeakState('idle'); setInputMode('speak'); setMicError(false)
            setMatchPairs([]); setShuffledB([]); setSelectedA(null); setSelectedB(null)
            setMatchedIds(new Set()); setWrongPair(null); setShowMeaning(false)
        } else if (activeSub?.realLife) setPhase('use')
        else completePart()
    }

    if (loading || !lesson) {
        return (
            <main className="flex min-h-screen items-center justify-center font-body">
                <NightBackground />
                <Firefly mood="thinking" size={100} glow={glowColors} />
            </main>
        )
    }

    const coreSpanish = (currentExercise?.answer || currentExercise?.options?.[0] || activeSub?.exercises?.[0]?.answer || lesson.variant?.storyBeat || '').trim()
    const coreEnglish = currentExercise?.meaning ?? lesson.coreMeaning ?? lesson.canDo

    return (
        <main className="min-h-screen font-body">
            <style>{`
                @keyframes xp-float { 0% { opacity: 0; transform: translateY(0) scale(.6); } 20% { opacity: 1; transform: translateY(-10px) scale(1.1); } 80% { opacity: 1; transform: translateY(-40px) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(.8); } }
                .xp-float { animation: xp-float 1.4s ease-out forwards; }
                @keyframes card-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
                .card-shake { animation: card-shake .4s ease-in-out; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fade-in .5s ease-out both; }
                @keyframes mic-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,107,107,.45); } 100% { box-shadow: 0 0 0 22px rgba(255,107,107,0); } }
                .mic-pulse { animation: mic-pulse 1.1s ease-out infinite; }
            `}</style>
            <NightBackground />

            {/* ── Header ── */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-night-950/80 border-b border-white/5">
                <div className="mx-auto max-w-3xl px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-3">
                    <button onClick={() => router.push('/course')} className="rounded-lg p-2 text-cream/60 hover:bg-night-800 hover:text-cream flex-shrink-0">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative h-2.5 sm:h-3">
                        <div className="absolute inset-0 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-glow transition-all ease-out duration-300" style={{ width: `${Math.min(100, phase === 'celebration' ? 100 : partProgress)}%` }} />
                        </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-cream/50 whitespace-nowrap">Part {partNumber}/{totalSubs}</span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Heart key={i} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all ${i < hearts ? 'fill-coral text-coral' : 'text-cream/15'}`} />
                        ))}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8 pb-10">

                {/* ── CELEBRATION ── */}
                {phase === 'celebration' && (
                    <div className="py-8 sm:py-12 text-center fade-in">
                        <div className="mb-6 flex justify-center"><Firefly mood="proud" size={120} glow={glowColors} /></div>
                        <h1 className="font-display text-2xl sm:text-3xl font-black text-cream mb-2">
                            {!activeSub || allDone ? 'Ability demonstrated!' : `Part ${partNumber} complete!`}
                        </h1>
                        <p className="text-cream/60 text-sm sm:text-base mb-6 max-w-md mx-auto italic">"{lesson.canDo}"</p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 max-w-md mx-auto">
                            <div className="rounded-xl border border-glow/30 bg-night-800/70 p-3"><p className="text-[10px] sm:text-xs text-cream/40 mb-1">Earned</p><p className="font-display text-xl sm:text-2xl font-bold text-glow">+{earnedXp}</p></div>
                            <div className="rounded-xl border border-leaf/30 bg-night-800/70 p-3"><p className="text-[10px] sm:text-xs text-cream/40 mb-1">Accuracy</p><p className="font-display text-xl sm:text-2xl font-bold text-leaf">{partAccuracy}%</p></div>
                            <div className="rounded-xl border border-coral/30 bg-night-800/70 p-3"><p className="text-[10px] sm:text-xs text-cream/40 mb-1">Hearts</p><p className="font-display text-xl sm:text-2xl font-bold text-coral">{hearts}/5</p></div>
                        </div>
                        <button onClick={() => router.push('/course')} className="w-full max-w-md py-4 rounded-xl bg-glow font-bold text-night-900 text-base hover:bg-glow-bright flex items-center justify-center gap-2 mx-auto">
                            Back to Path <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* ── ENCOUNTER ── */}
                {phase === 'encounter' && activeSub && (
                    <div className="space-y-5 sm:space-y-6 fade-in">
                        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-glow/20 bg-glow/5">
                            <Target className="h-5 w-5 text-glow flex-shrink-0" />
                            <p className="text-xs sm:text-sm text-cream/90"><span className="font-bold text-glow">Today's ability:</span> {lesson.canDo}</p>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${modeTheme.color}`}>
                            <modeTheme.icon className="h-4 w-4" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{modeTheme.label}</span>
                            <span className="text-[10px] sm:text-xs opacity-70">· {modeTheme.purpose}</span>
                        </div>
                        <div className="relative rounded-2xl border border-white/10 bg-night-800/80 p-6 sm:p-8 backdrop-blur-sm flex flex-col items-center text-center space-y-5 min-h-[280px] justify-center">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40">Listen & observe</p>
                            <h2 className="font-display text-2xl sm:text-4xl font-black text-cream leading-tight">{coreSpanish}</h2>
                            <SpeakerButton text={coreSpanish} lang="es-ES" size="lg" />
                            <div className="w-full max-w-sm">
                                <p className={`text-base sm:text-lg text-cream/60 ${showMeaning ? '' : 'blur-meaning'}`} style={showMeaning ? undefined : { filter: 'blur(6px)', userSelect: 'none' }}>{coreEnglish}</p>
                                <button onClick={() => setShowMeaning(!showMeaning)} className="mt-3 text-xs font-bold text-glow flex items-center gap-1 mx-auto">
                                    {showMeaning ? <><EyeOff className="h-3 w-3" /> Hide meaning</> : <><Eye className="h-3 w-3" /> Reveal meaning</>}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => { setPhase('practice'); }} className="w-full py-4 rounded-xl font-bold text-night-900 text-base sm:text-lg bg-glow hover:bg-glow-bright flex items-center justify-center gap-2">
                            Start Practice <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* ── PRACTICE ── */}
                {phase === 'practice' && activeSub && currentExercise && (
                    <div className={`relative ${shakeCard ? 'card-shake' : ''} fade-in`}>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${modeTheme.color}`}>
                                <modeTheme.icon className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase">{modeTheme.label}</span>
                            </div>
                            <span className="text-[10px] sm:text-xs text-cream/40">{currentIndex + 1} / {totalExercises}</span>
                        </div>

                        {showXpFloat && (
                            <div className="pointer-events-none absolute left-1/2 -top-3 z-10 xp-float">
                                <div className="inline-flex items-center gap-1 rounded-full bg-glow px-2.5 py-1 text-xs font-black text-night-900">
                                    <Sparkles className="h-3 w-3" /> +{Math.max(1, Math.round(activeSub.xpReward / totalExercises))} XP
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-white/10 bg-night-800/70 p-4 sm:p-6 backdrop-blur-sm min-h-[380px] flex flex-col">
                            <div className="flex-1">
                                {(currentExercise.type === 'mcq' || currentExercise.type === 'fill_blank' || currentExercise.type === 'listen_type') && (
                                    <h2 className="font-display text-base sm:text-lg font-bold text-cream leading-snug mb-4 sm:mb-5">{currentExercise.prompt}</h2>
                                )}

                                {/* ── SPEAK exercise: mic-first ── */}
                                {currentExercise.type === 'speak' && inputMode === 'speak' && (
                                    <div className="flex flex-col items-center gap-4 sm:gap-5 py-2 sm:py-4">
                                        <h2 className="font-display text-base sm:text-lg font-bold text-cream leading-snug text-center">{currentExercise.prompt}</h2>

                                        {heard && (
                                            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-night-900/60 px-4 py-3 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-cream/40 mb-1">Ecla heard</p>
                                                <p className="text-sm sm:text-base text-cream italic">"{heard}"</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={speakState === 'recording' ? stopSpeaking : startSpeaking}
                                            disabled={speakState === 'processing' || isRevealed}
                                            className={`relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full transition-all disabled:opacity-50 ${speakState === 'recording'
                                                    ? 'bg-coral text-night-900 mic-pulse'
                                                    : 'bg-glow text-night-900 hover:bg-glow-bright active:scale-95'
                                                }`}
                                        >
                                            {speakState === 'recording' ? <Square className="h-7 w-7 sm:h-8 sm:w-8" />
                                                : speakState === 'processing' ? <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin" />
                                                    : <Mic className="h-7 w-7 sm:h-8 sm:w-8" />}
                                        </button>

                                        <p className="text-xs sm:text-sm text-cream/50 text-center min-h-[18px]">
                                            {speakState === 'recording' ? 'Listening… tap to finish'
                                                : speakState === 'processing' ? 'Checking what you said…'
                                                    : micError ? 'Mic unavailable — you can type it instead.'
                                                        : 'Tap the mic and say it in Spanish'}
                                        </p>

                                        <button onClick={() => { setInputMode('type'); setHeard(null); setMicError(false) }} className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-cream/40 hover:text-cream">
                                            <Keyboard className="h-3.5 w-3.5" /> Prefer typing?
                                        </button>
                                    </div>
                                )}

                                {/* ── SPEAK exercise typed fallback ── */}
                                {currentExercise.type === 'speak' && inputMode === 'type' && (
                                    <div className="space-y-4">
                                        <h2 className="font-display text-base sm:text-lg font-bold text-cream leading-snug">{currentExercise.prompt}</h2>
                                        <input
                                            type="text" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isRevealed || checking}
                                            className={`w-full p-4 rounded-xl border-2 bg-night-900/50 text-cream text-base focus:outline-none ${isRevealed ? isCorrect ? 'border-leaf/50' : 'border-coral/50' : 'border-white/10 focus:border-glow'}`}
                                            placeholder="Type it in Spanish…" autoFocus
                                            onKeyDown={e => e.key === 'Enter' && !isRevealed && !checking && checkAnswer(userInput)}
                                        />
                                        {!isRevealed && (
                                            <div className="flex gap-2">
                                                <button onClick={() => checkAnswer(userInput)} disabled={!userInput.trim() || checking} className="flex-1 py-3.5 rounded-xl font-bold bg-glow text-night-900 disabled:opacity-40 flex items-center justify-center gap-2">
                                                    {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'Check'}
                                                </button>
                                                <button onClick={() => { setInputMode('speak'); setUserInput('') }} className="px-4 rounded-xl border border-white/10 text-cream/60 hover:text-cream">
                                                    <Mic className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── MCQ / listen_choose ── */}
                                {(currentExercise.type === 'mcq' || currentExercise.type === 'listen_choose') && (
                                    <div className="space-y-2 sm:space-y-3">
                                        {currentExercise.type === 'listen_choose' && <div className="mb-4 flex justify-center"><SpeakerButton text={currentExercise.audio} lang="es-ES" size="lg" /></div>}
                                        {(currentExercise.options || []).map((option: string, i: number) => {
                                            const isCorrectOption = option === currentExercise.answer
                                            const isSelected = userInput === option
                                            let styles = 'border-white/10 bg-night-900/50 hover:border-white/25'
                                            if (isRevealed) {
                                                if (isCorrectOption) styles = 'border-leaf/50 bg-leaf/10 text-leaf'
                                                else if (isSelected && !isCorrectOption) styles = 'border-coral/50 bg-coral/10 text-coral'
                                                else styles = 'opacity-40'
                                            }
                                            return (
                                                <button key={i} onClick={() => !isRevealed && checkAnswer(option)} disabled={isRevealed} className={`w-full p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between min-h-[48px] ${styles}`}>
                                                    <span className="text-sm font-medium">{option}</span>
                                                    {isRevealed && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-leaf flex-shrink-0 ml-2" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* ── Typed exercises ── */}
                                {(currentExercise.type === 'fill_blank' || currentExercise.type === 'listen_type') && (
                                    <div className="space-y-4">
                                        {currentExercise.type === 'listen_type' && <div className="mb-4 flex justify-center"><SpeakerButton text={currentExercise.audio} lang="es-ES" size="lg" /></div>}
                                        <input
                                            type="text" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isRevealed || checking}
                                            className={`w-full p-4 rounded-xl border-2 bg-night-900/50 text-cream text-base focus:outline-none ${isRevealed ? isCorrect ? 'border-leaf/50' : 'border-coral/50' : 'border-white/10 focus:border-glow'}`}
                                            placeholder="Type your answer…" autoFocus
                                            onKeyDown={e => e.key === 'Enter' && !isRevealed && !checking && checkAnswer(userInput)}
                                        />
                                        {!isRevealed && (
                                            <button onClick={() => checkAnswer(userInput)} disabled={!userInput.trim() || checking} className="w-full py-3.5 rounded-xl font-bold bg-glow text-night-900 disabled:opacity-40 flex items-center justify-center gap-2">
                                                {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'Check Answer'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* ── Match ── */}
                                {currentExercise.type === 'match' && (() => {
                                    if (matchPairs.length === 0 && currentExercise.pairs) initMatchExercise(currentExercise.pairs)
                                    const tileStyles = (id: string, side: 'a' | 'b') => {
                                        if (matchedIds.has(id)) return 'border-leaf/40 bg-leaf/10 text-leaf opacity-50'
                                        if (wrongPair && ((side === 'a' && wrongPair.a === id) || (side === 'b' && wrongPair.b === id))) return 'border-coral bg-coral/20 text-coral'
                                        if ((side === 'a' && selectedA === id) || (side === 'b' && selectedB === id)) return 'border-glow bg-glow/15 ring-2 ring-glow/30'
                                        return 'border-white/10 bg-night-900/60 hover:border-white/25'
                                    }
                                    return (
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                            <div className="space-y-2">{matchPairs.map(p => <button key={`a-${p.id}`} onClick={() => handleMatchClick('a', p.id)} disabled={matchedIds.has(p.id)} className={`w-full p-3 rounded-lg border-2 text-left text-xs sm:text-sm font-medium min-h-[44px] ${tileStyles(p.id, 'a')}`}>{p.a}</button>)}</div>
                                            <div className="space-y-2">{shuffledB.map(p => <button key={`b-${p.id}`} onClick={() => handleMatchClick('b', p.id)} disabled={matchedIds.has(p.id)} className={`w-full p-3 rounded-lg border-2 text-left text-xs sm:text-sm font-medium min-h-[44px] ${tileStyles(p.id, 'b')}`}>{p.b}</button>)}</div>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* ── Feedback (form vs function) ── */}
                            {isRevealed && currentExercise.type !== 'match' && (
                                <div className="mt-5 space-y-3">
                                    <div className={`rounded-lg p-3.5 sm:p-4 ${isCorrect ? 'bg-leaf/10 border border-leaf/30' : 'bg-coral/10 border border-coral/30'}`}>
                                        <div className="flex items-start gap-2.5">
                                            {isCorrect ? <CheckCircle2 className="h-5 w-5 text-leaf flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />}
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <p className={`text-sm font-semibold ${isCorrect ? 'text-leaf' : 'text-coral'}`}>
                                                    {isCorrect
                                                        ? (['fuzzy', 'variant', 'ai'].includes(gradeMethod ?? '') ? 'Meaning communicated — that counts.' : 'Correct.')
                                                        : 'Not quite.'}
                                                </p>
                                                {currentExercise.type === 'speak' && heard && !isCorrect && (
                                                    <p className="text-xs text-cream/80">Heard: <span className="italic">"{heard}"</span></p>
                                                )}
                                                {!isCorrect && (
                                                    <p className="text-xs text-cream/80">Answer: <span className="font-bold text-cream">{currentExercise.answer}</span></p>
                                                )}
                                                {currentExercise.type === 'speak' && (
                                                    <div className="pt-1"><SpeakerButton text={currentExercise.answer} lang="es-ES" size="sm" /></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleNext} className="w-full py-3.5 rounded-xl font-bold text-sm sm:text-base text-night-900 bg-glow hover:bg-glow-bright flex items-center justify-center gap-2">
                                        {currentIndex === totalExercises - 1 ? 'Finish Part' : 'Continue'} <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            {isRevealed && currentExercise.type === 'match' && (
                                <button onClick={handleNext} className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm sm:text-base text-night-900 bg-glow hover:bg-glow-bright flex items-center justify-center gap-2">
                                    {currentIndex === totalExercises - 1 ? 'Finish Part' : 'Continue'} <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── USE ── */}
                {phase === 'use' && activeSub?.realLife && (
                    <div className="fade-in space-y-5">
                        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-purple-400/30 bg-purple-400/5">
                            <Target className="h-5 w-5 text-purple-400 flex-shrink-0" />
                            <p className="text-xs sm:text-sm text-cream/90"><span className="font-bold text-purple-400">Real-world mission:</span> {activeSub.realLife.prompt}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-night-800/80 p-5 sm:p-8 text-center space-y-5">
                            <Firefly mood="proud" size={80} glow={glowColors} />
                            <p className="text-sm sm:text-base text-cream/80">Use your new ability in a real interaction with Ecla.</p>
                            <button onClick={() => router.push(`/chat?seed=${encodeURIComponent(activeSub.realLife!.chatSeed || '')}`)} className="w-full py-3.5 rounded-xl bg-pro text-night-900 font-bold flex items-center justify-center gap-2">
                                <MessageCircle className="h-5 w-5" /> Start Mission Chat
                            </button>
                            <button onClick={completePart} disabled={saving} className="w-full py-3 rounded-xl border border-white/10 text-cream/60 text-sm">
                                {saving ? 'Saving…' : 'Skip & Finish Part'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default function LearnPage() {
    return (
        <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><NightBackground /><Firefly mood="thinking" size={100} /></main>}>
            <LearnPageContent />
        </Suspense>
    )
}