'use client'

/**
 * ECLA Lesson Player — "personal language training room"
 *
 * Three-zone cockpit: Lesson Journey (left) · Workspace (center) · Tools (right).
 * Activity-driven renderer over the 9-stage engine data
 * (ENCOUNTER → UNDERSTAND → NOTICE → RECOGNIZE → RETRIEVE → PRODUCE →
 *  INTERACT → TRANSFER → RETAIN) written by seedSublessons.ts.
 *
 * Principles applied: Context → Language → Action → Communication → Evidence.
 * Calm feedback (teaching, not judging). Mic-first production. Repair = success.
 * Gamification stays in the top bar edges only. Firefly demoted to completion.
 */

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    Mic, Square, Volume2, ChevronRight, ChevronLeft, Menu, SlidersHorizontal,
    BookOpen, Lightbulb, AudioLines, StickyNote, Check, Circle, Dot, X,
} from 'lucide-react'
import NightBackground from '@/components/NightBackground'
import Firefly from '@/components/Firefly'
import SpeakerButton from '@/components/SpeakerButton'
import { useEquippedGlow } from '@/lib/useEquippedGlow'
import { gradeLocal } from '@/lib/grading'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const STAGE_MIN: Record<string, number> = {
    ENCOUNTER: 1, UNDERSTAND: 2, NOTICE: 2, RECOGNIZE: 2, RETRIEVE: 2,
    PRODUCE: 3, INTERACT: 4, TRANSFER: 4, RETAIN: 2,
}
const STAGE_HINT: Record<string, string> = {
    ENCOUNTER: 'Meet the situation', UNDERSTAND: 'Understand the meaning', NOTICE: 'Notice the language',
    RECOGNIZE: 'Recognize the pattern', RETRIEVE: 'Recall it', PRODUCE: 'Use it',
    INTERACT: 'Communicate', TRANSFER: 'New situation', RETAIN: 'Remember later',
}

type Feedback = { kind: 'good' | 'retry' | 'info'; text: string; heard?: string; target?: string } | null

/* ── tiny mic hook: record → transcribe ── */
function useMic(getToken: () => Promise<string | null>, onText: (t: string) => void, onFail?: () => void) {
    const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle')
    const recRef = useRef<MediaRecorder | null>(null)
    const chunks = useRef<Blob[]>([])
    const stop = () => { const r = recRef.current; if (r && r.state === 'recording') r.stop() }
    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const rec = new MediaRecorder(stream)
            recRef.current = rec; chunks.current = []
            rec.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data) }
            rec.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                setState('processing')
                try {
                    const token = await getToken()
                    const res = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
                        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'audio/webm' },
                        body: new Blob(chunks.current, { type: 'audio/webm' }),
                    })
                    const data = await res.json()
                    setState('idle')
                    if (data.text?.trim()) onText(data.text.trim()); else onFail?.()
                } catch { setState('idle'); onFail?.() }
            }
            rec.start(); setState('recording')
        } catch { setState('idle'); onFail?.() }
    }
    return { state, start, stop }
}

function LearnPlayer() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const modeParam = searchParams.get('mode')
    const { getToken } = useAuth()
    const glowColors = useEquippedGlow()

    const [lesson, setLesson] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [stageIdx, setStageIdx] = useState(0)
    const [actIdx, setActIdx] = useState(0)
    const [doneStages, setDoneStages] = useState<Set<number>>(new Set())
    const [autoAdvance, setAutoAdvance] = useState(true)
    const [feedback, setFeedback] = useState<Feedback>(null)
    const [solved, setSolved] = useState(false)
    const [journeyOpen, setJourneyOpen] = useState(false)
    const [toolsOpen, setToolsOpen] = useState(false)
    const [finished, setFinished] = useState(false)
    const [saving, setSaving] = useState(false)
    const counts = useRef({ correct: 0, incorrect: 0 })

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/lessons/${params.conceptId}${modeParam ? `?mode=${modeParam}` : ''}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                setLesson(data.lesson)
            } catch (e) { console.error(e) } finally { setLoading(false) }
        })()
    }, [getToken, params.conceptId, modeParam])

    const mode = modeParam ?? lesson?.mode ?? 'STORY'
    const experience = lesson?.subLessons?.find((s: any) => s.type === mode) ?? lesson?.subLessons?.[0]
    const journey: any[] = experience?.journey ?? []
    const stage = journey[stageIdx]
    const activity = stage?.activities?.[actIdx]

    const advance = () => {
        setFeedback(null); setSolved(false)
        if (stage && actIdx < (stage.activities?.length ?? 1) - 1) { setActIdx(a => a + 1); return }
        setDoneStages(prev => new Set([...prev, stageIdx]))
        if (stageIdx < journey.length - 1) { setStageIdx(s => s + 1); setActIdx(0) }
        else complete()
    }

    const back = () => {
        setFeedback(null); setSolved(false)
        if (actIdx > 0) setActIdx(a => a - 1)
        else if (stageIdx > 0) { setStageIdx(s => s - 1); setActIdx(0) }
    }

    const complete = async () => {
        if (!lesson || !experience) return
        setSaving(true)
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/v1/lessons/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    conceptId: lesson.conceptId, subLessonId: experience.id, mode,
                    correctCount: counts.current.correct, incorrectCount: counts.current.incorrect,
                    xpEarned: experience.xpReward,
                }),
            })
            window.dispatchEvent(new Event('ecla:progress-updated'))
            window.dispatchEvent(new Event('luma:progress-updated'))
        } catch (e) { console.error(e) } finally { setSaving(false); setFinished(true) }
    }

    /** calm feedback: what happened / why / next */
    const report = (correct: boolean, f: Feedback) => {
        if (correct) counts.current.correct++; else counts.current.incorrect++
        setSolved(true)
        setFeedback(f)
        if (correct && autoAdvance) setTimeout(() => advance(), 1600)
    }

    if (loading) return (
        <main className="min-h-screen flex items-center justify-center font-body">
            <NightBackground />
            <p className="text-cream/50 text-sm">Preparing your training room…</p>
        </main>
    )

    if (!lesson) return (
        <main className="min-h-screen flex items-center justify-center font-body">
            <NightBackground />
            <p className="text-cream/60 text-sm">Lesson not found.</p>
        </main>
    )

    /* ── Completion screen (evidence, not confetti) ── */
    if (finished) {
        const m = lesson.mastery
        return (
            <main className="min-h-screen font-body">
                <NightBackground />
                <div className="mx-auto max-w-lg px-4 py-14">
                    <div className="flex justify-center mb-6"><Firefly mood="proud" size={90} glow={glowColors} /></div>
                    <h1 className="font-display text-2xl font-bold text-cream text-center mb-1">Lesson complete</h1>
                    <p className="text-cream/60 text-center text-sm mb-8">{lesson.breadcrumb?.competency}</p>
                    <div className="rounded-2xl border border-white/10 bg-night-800/70 p-5 mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-3">You can now</p>
                        <ul className="space-y-2 text-sm text-cream/80">
                            <li className="flex gap-2"><Check className="h-4 w-4 text-leaf flex-shrink-0 mt-0.5" /> {lesson.canDo}</li>
                            <li className="flex gap-2"><Check className="h-4 w-4 text-leaf flex-shrink-0 mt-0.5" /> Recover when you don't understand</li>
                            <li className="flex gap-2"><Check className="h-4 w-4 text-leaf flex-shrink-0 mt-0.5" /> Use it in a new situation</li>
                        </ul>
                    </div>
                    {m && (
                        <div className="rounded-2xl border border-white/10 bg-night-800/70 p-5 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-cream/40">Evidence collected</p>
                                <span className="text-xs font-bold text-violet-400">{m.level}</span>
                            </div>
                            {Object.entries(m.dimensions as Record<string, number | null>).map(([k, v]) => (
                                <div key={k} className="flex items-center gap-3 mb-2">
                                    <span className="w-28 text-xs text-cream/60 capitalize">{k}</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${v ?? 0}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-xs text-cream/50">{v == null ? '—' : `${v}%`}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={() => router.push('/course')} className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm">
                        Continue
                    </button>
                </div>
            </main>
        )
    }

    const progressPct = Math.round(((stageIdx + (solved ? 1 : 0)) / Math.max(1, journey.length)) * 100)

    return (
        <main className="min-h-screen font-body bg-[#0B0B10] text-white">
            {/* ── Top bar ── */}
            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B10]/90 backdrop-blur">
                <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center gap-4">
                    <button onClick={() => setJourneyOpen(true)} className="lg:hidden text-cream/60"><Menu className="h-5 w-5" /></button>
                    <span className="font-display font-bold text-lg tracking-tight">ECLA</span>
                    <nav className="hidden md:flex items-center gap-1.5 text-xs text-cream/50 min-w-0">
                        <span className="truncate">{lesson.breadcrumb?.course}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="truncate">{lesson.breadcrumb?.unit}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-cream/80 truncate">{lesson.breadcrumb?.competency}</span>
                    </nav>
                    <div className="ml-auto flex items-center gap-4 text-xs text-cream/60">
                        <span>🔥 {lesson.mastery ? '—' : ''}</span>
                        <button onClick={() => setToolsOpen(true)} className="xl:hidden text-cream/60"><SlidersHorizontal className="h-5 w-5" /></button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px] gap-6 px-4 py-6">

                {/* ── Left: Lesson Journey ── */}
                <aside className={`${journeyOpen ? 'fixed inset-0 z-50 bg-black/60 lg:static lg:bg-transparent' : 'hidden'} lg:block`} onClick={() => setJourneyOpen(false)}>
                    <div className="bg-[#13131B] lg:bg-transparent h-full w-72 lg:w-auto p-5 lg:p-0 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/50">Lesson journey</p>
                            <span className="text-xs text-cream/50">{stageIdx + 1} / {journey.length}</span>
                            <button className="lg:hidden" onClick={() => setJourneyOpen(false)}><X className="h-4 w-4 text-cream/50" /></button>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 mb-5 overflow-hidden">
                            <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <ol className="space-y-1">
                            {journey.map((s: any, i: number) => {
                                const done = doneStages.has(i)
                                const current = i === stageIdx
                                return (
                                    <li key={s.id}>
                                        <button
                                            onClick={() => { if (done || current) { setStageIdx(i); setActIdx(0); setFeedback(null); setSolved(false); setJourneyOpen(false) } }}
                                            className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${current ? 'bg-violet-600/15 border border-violet-500/30' : 'border border-transparent hover:bg-white/5'}`}
                                        >
                                            <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-green-600 text-white' : current ? 'bg-violet-600 text-white' : 'bg-white/10 text-cream/50'}`}>
                                                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className={`block text-sm font-semibold ${current ? 'text-white' : 'text-cream/70'}`}>{s.title}</span>
                                                <span className="block text-[11px] text-cream/40">{STAGE_HINT[s.stage] ?? s.objective}</span>
                                            </span>
                                            <span className="text-[10px] text-cream/40">{STAGE_MIN[s.stage] ?? 2} min</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                </aside>

                {/* ── Center: Workspace ── */}
                <section className="min-w-0">
                    {stage && (
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <span className="inline-block rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mb-2">{stage.stage}</span>
                                <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                                    {stage.stage === 'PRODUCE' ? "Let's use it!" : stage.stage === 'ENCOUNTER' ? 'Meet the situation' : stage.stage === 'INTERACT' ? 'Talk with someone' : stage.stage === 'TRANSFER' ? 'A new situation' : stage.title}
                                </h1>
                                <p className="text-sm text-cream/50 mt-1">{stage.objective}</p>
                            </div>
                        </div>
                    )}

                    {activity && (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            lesson={lesson}
                            getToken={getToken}
                            report={report}
                        />
                    )}

                    {/* ── Calm feedback layer ── */}
                    {feedback && (
                        <div className={`mt-4 rounded-xl border p-4 text-sm ${feedback.kind === 'good' ? 'border-green-600/30 bg-green-600/10 text-green-300' : feedback.kind === 'retry' ? 'border-amber-600/30 bg-amber-600/10 text-amber-200' : 'border-white/10 bg-white/5 text-cream/70'}`}>
                            <p className="font-semibold">{feedback.text}</p>
                            {feedback.heard && <p className="mt-1 text-cream/60">I heard: <span className="italic">"{feedback.heard}"</span></p>}
                            {feedback.target && <p className="mt-1 text-cream/60">Target: <span className="font-semibold text-cream/80">{feedback.target}</span></p>}
                        </div>
                    )}

                    {/* ── Bottom bar ── */}
                    <div className="mt-6 flex items-center justify-between gap-3">
                        <button onClick={back} disabled={stageIdx === 0 && actIdx === 0} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-cream/60 hover:text-cream disabled:opacity-40">
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <label className="hidden sm:flex items-center gap-2 text-xs text-cream/50">
                            Auto-advance
                            <button onClick={() => setAutoAdvance(v => !v)} className={`h-5 w-9 rounded-full transition-colors ${autoAdvance ? 'bg-violet-600' : 'bg-white/10'}`}>
                                <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${autoAdvance ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                        </label>
                        <button
                            onClick={advance}
                            disabled={!solved}
                            className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                        >
                            Continue
                            {stageIdx < journey.length - 1 && <span className="hidden md:inline text-white/60 font-normal">Step {stageIdx + 2} · {journey[stageIdx + 1]?.title}</span>}
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </section>

                {/* ── Right: Tools ── */}
                <aside className={`${toolsOpen ? 'fixed inset-0 z-50 bg-black/60 xl:static xl:bg-transparent' : 'hidden'} xl:block`} onClick={() => setToolsOpen(false)}>
                    <div className="bg-[#13131B] xl:bg-transparent h-full w-80 xl:w-auto p-5 xl:p-0 overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/50">Tools</p>
                            <button className="xl:hidden" onClick={() => setToolsOpen(false)}><X className="h-4 w-4 text-cream/50" /></button>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-3">Vocabulary</p>
                            <ul className="space-y-2">
                                {(lesson.tools?.vocabulary ?? []).slice(0, 5).map((v: any) => (
                                    <li key={v.word} className="flex items-center gap-2 text-sm">
                                        <SpeakerButton text={v.word} lang="es-ES" size="sm" />
                                        <span className="text-cream/80">{v.word}</span>
                                        <span className="ml-auto text-cream/40 text-xs">{v.translation}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {lesson.tools?.grammar && (
                            <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Language help</p>
                                <p className="text-sm text-cream/70 leading-relaxed">{lesson.tools.grammar}</p>
                            </div>
                        )}

                        {lesson.tools?.pronunciation && (
                            <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2 flex items-center gap-1.5"><AudioLines className="h-3.5 w-3.5" /> Pronunciation</p>
                                <p className="text-sm text-cream/70 leading-relaxed">{lesson.tools.pronunciation}</p>
                            </div>
                        )}

                        {lesson.mastery && (
                            <div className="rounded-2xl border border-white/10 bg-[#13131B] p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-cream/50 mb-2">Mastery</p>
                                <p className="text-sm font-bold text-violet-400 mb-3">{lesson.mastery.level}</p>
                                {Object.entries(lesson.mastery.dimensions as Record<string, number | null>).map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-2 mb-2">
                                        <span className="w-24 text-[11px] text-cream/50 capitalize">{k}</span>
                                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full bg-violet-500" style={{ width: `${v ?? 0}%` }} />
                                        </div>
                                        <span className="w-8 text-right text-[11px] text-cream/40">{v == null ? '—' : `${v}%`}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </main>
    )
}

/* ══════════════════════ Activity renderer ══════════════════════ */

function ActivityCard({ activity, lesson, getToken, report }: {
    activity: any; lesson: any; getToken: () => Promise<string | null>
    report: (correct: boolean, f: Feedback) => void
}) {
    const [picked, setPicked] = useState<string | null>(null)
    const [typed, setTyped] = useState('')
    const [played, setPlayed] = useState(false)
    const [chat, setChat] = useState<{ role: 'ai' | 'learner'; text: string }[]>([])
    const [busy, setBusy] = useState(false)

    const target: string = activity.input?.target ?? activity.expectedOutput ?? ''
    const options: string[] = activity.input?.options ?? []
    const correctOption = options.includes(target) ? target : options[0]

    const mic = useMic(getToken, text => handleOpen(text), () => report(false, { kind: 'retry', text: "I didn't catch that. Listen once more, then try again." }))

    /* open-response evaluation (recall / produce / transfer / retain) */
    const handleOpen = async (answer: string) => {
        const accept: string[] = activity.expectedOutput?.accepted ?? (target ? [target] : [])
        const local = gradeLocal(answer, { type: 'recall', answer: target || accept[0], accept })
        if (local.correct) {
            report(true, { kind: 'good', text: 'Good — I understood you. Meaning communicated.', heard: answer })
            return
        }
        if (local.needsJudge) {
            setBusy(true)
            try {
                const token = await getToken()
                const r = await fetch(`${API_URL}/api/v1/lessons/grade`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ answer, expected: target || accept[0], accept }),
                })
                const j = await r.json()
                setBusy(false)
                if (j.correct) report(true, { kind: 'good', text: 'I understood your meaning. Successful communication.', heard: answer })
                else report(false, { kind: 'retry', text: 'Your message was understandable next time — try the target expression.', heard: answer, target })
            } catch { setBusy(false); report(true, { kind: 'info', text: 'Recorded. We will revisit this later.', heard: answer }) }
            return
        }
        report(false, { kind: 'retry', text: 'Almost. Try again — you can take your time.', heard: answer, target })
    }

    /* interaction: AI partner exchange */
    const interact = async (learnerText: string) => {
        setChat(c => [...c, { role: 'learner', text: learnerText }])
        setBusy(true)
        try {
            const token = await getToken()
            const r = await fetch(`${API_URL}/api/v1/missions/${lesson.conceptId}/turn`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ history: [...chat, { role: 'learner', text: learnerText }] }),
            })
            const j = await r.json()
            setChat(c => [...c, { role: 'ai', text: j.text }])
            report(true, { kind: 'good', text: 'Nice — the conversation continued. That is real interaction.' })
        } catch { setBusy(false) }
        setBusy(false)
    }

    const MicButton = ({ say }: { say?: string }) => (
        <div className="flex flex-col items-center gap-3 py-4">
            <button
                onClick={mic.state === 'recording' ? mic.stop : mic.start}
                disabled={mic.state === 'processing' || busy}
                className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${mic.state === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/40'}`}
            >
                {mic.state === 'recording' ? <Square className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
            <p className="text-xs text-cream/50">
                {mic.state === 'recording' ? 'Listening… tap to finish' : mic.state === 'processing' ? 'Checking…' : say ? `Tap to speak · Say "${say}"` : 'Tap to speak'}
            </p>
        </div>
    )

    const TypeFallback = () => (
        <div className="flex gap-2 mt-3">
            <input
                value={typed} onChange={e => setTyped(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && typed.trim() && handleOpen(typed)}
                placeholder="…or type it"
                className="flex-1 rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
            <button onClick={() => handleOpen(typed)} disabled={!typed.trim()} className="rounded-xl bg-white/10 px-4 text-sm font-semibold disabled:opacity-40">Check</button>
        </div>
    )

    switch (activity.type) {
        /* ── context / encounter ── */
        case 'context':
            return (
                <Card>
                    <Situation text={activity.input?.scenario} target={activity.input?.targetLanguage} onPlayed={() => setPlayed(true)} />
                    <button onClick={() => report(true, { kind: 'info', text: "Context understood. Let's notice the language." })} disabled={!played} className={CONTINUE}>
                        {played ? 'Continue' : 'Listen first'}
                    </button>
                </Card>
            )

        /* ── listening ── */
        case 'listening':
            return (
                <Card>
                    <p className="text-sm text-cream/60 mb-3">{activity.prompt}</p>
                    <div className="flex justify-center mb-4"><SpeakerButton text={(activity.input?.utterances ?? [target])[0]} lang="es-ES" size="lg" onEnd={() => setPlayed(true)} /></div>
                    <button
                        onClick={() => report(true, { kind: 'info', text: "Context understood. Let's notice the language." })}
                        disabled={!played}
                        className={CONTINUE}
                    >
                        {played ? 'Continue' : 'Listen first'}
                    </button>
                </Card>
            )

        /* ── meaning discovery / comprehension / recognition (MCQ, calm) ── */
        case 'meaning_discovery':
        case 'comprehension':
        case 'recognition': {
            // Defensive: some seeded comprehension activities ship without options.
            // Synthesize intent options from the can-do (Art. 6: meaning first)
            // so the learner can NEVER be stuck on an empty card.
            const opts = options.length ? options : [
                `They are trying to ${lesson.canDo.toLowerCase()}`,
                'They are ending the conversation.',
                'They are talking about something unrelated.',
            ]
            const correct = opts.includes(target) ? target : opts[0]
            const audio = activity.input?.target ?? activity.input?.utterances?.[0]
            return (
                <Card>
                    <p className="text-sm text-cream/70 mb-4">{activity.prompt}</p>
                    {audio && (
                        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
                            <SpeakerButton text={audio} lang="es-ES" size="md" />
                            <span className="text-sm text-cream/70">Listen, then choose.</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        {opts.map(o => (
                            <button key={o} onClick={() => setPicked(o)} disabled={!!picked}
                                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${picked === o ? (o === correct ? 'border-green-600/50 bg-green-600/10' : 'border-amber-600/50 bg-amber-600/10') : 'border-white/10 bg-[#1A1A24] hover:border-white/25'}`}>
                                {o}
                            </button>
                        ))}
                    </div>
                    {picked && (
                        <button onClick={() => report(picked === correct, picked === correct
                            ? { kind: 'good', text: 'Exactly. You understood the meaning.' }
                            : { kind: 'retry', text: 'Not quite — notice what the speaker is trying to do.', target: correct })} className={`${CONTINUE} mt-4`}>
                            Continue
                        </button>
                    )}
                </Card>
            )
        }

        /* ── listening discrimination ── */
        case 'listening_discrimination': {
            const opts = [target, ...(activity.input?.distractors ?? [])].slice(0, 4)
            return (
                <Card>
                    <p className="text-sm text-cream/70 mb-3">Tap what you hear.</p>
                    <div className="flex justify-center mb-4"><SpeakerButton text={target} lang="es-ES" size="lg" /></div>
                    <div className="space-y-2">
                        {opts.map(o => (
                            <button key={o} onClick={() => setPicked(o)} disabled={!!picked}
                                className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${picked === o ? (o === target ? 'border-green-600/50 bg-green-600/10' : 'border-amber-600/50 bg-amber-600/10') : 'border-white/10 bg-[#1A1A24] hover:border-white/25'}`}>
                                {o}
                            </button>
                        ))}
                    </div>
                    {picked && (
                        <button onClick={() => report(picked === target, picked === target
                            ? { kind: 'good', text: 'Clear ear. You heard it correctly.' }
                            : { kind: 'retry', text: 'Listen once more — notice the rhythm.', target })} className={`${CONTINUE} mt-4`}>
                            Continue
                        </button>
                    )}
                </Card>
            )
        }

        /* ── noticing / pronunciation (info + listen) ── */
        case 'noticing':
        case 'pronunciation':
            return (
                <Card>
                    <p className="text-sm text-cream/70 mb-3">{activity.prompt}</p>
                    {activity.input?.patterns && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {activity.input.patterns.map((p: string) => (
                                <span key={p} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-cream/80">{p}</span>
                            ))}
                        </div>
                    )}
                    {activity.input?.target && (
                        <div className="flex items-center gap-3 mb-4 rounded-xl bg-white/5 border border-white/10 p-3">
                            <SpeakerButton text={activity.input.target} lang="es-ES" size="md" />
                            <span className="text-sm text-cream/80">{activity.input.target}</span>
                        </div>
                    )}
                    {activity.input?.note && <p className="text-xs text-cream/50 mb-4">{activity.input.note}</p>}
                    <button onClick={() => report(true, { kind: 'info', text: 'Noted. Now retrieve it from memory.' })} className={CONTINUE}>Continue</button>
                </Card>
            )

        /* ── recall / completion / produce / transfer / retain (mic-first) ── */
        case 'recall':
        case 'completion':
        case 'guided_speaking':
        case 'free_retrieval':
        case 'simulation':
        case 'unexpected_interaction':
        case 'spaced_retrieval':
        case 'mixed_context_review':
            return (
                <Card>
                    <p className="text-sm text-cream/70 mb-2">{activity.prompt}</p>
                    {activity.input?.scenario && <p className="text-sm text-cream/50 mb-2 italic">{activity.input.scenario}</p>}
                    {activity.input?.support && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(Array.isArray(activity.input.support) ? activity.input.support : [activity.input.support]).map((s: string) => (
                                <span key={s} className="rounded-lg bg-violet-600/10 border border-violet-500/30 px-3 py-1 text-xs text-violet-300 capitalize">
                                    {String(s).replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    )}
                    <MicButton say={typeof target === 'string' && target.length < 60 ? target : undefined} />
                    <TypeFallback />
                </Card>
            )

        /* ── interaction / role-play ── */
        case 'guided_interaction':
        case 'role_play':
            return (
                <Card>
                    <p className="text-sm text-cream/70 mb-4">{activity.prompt}</p>
                    <div className="space-y-2 mb-4">
                        {chat.length === 0 && activity.input?.opening && (
                            <Bubble role="ai" text={activity.input.opening} />
                        )}
                        {chat.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
                    </div>
                    {chat.length === 0 ? (
                        <>
                            <MicButton />
                            <TypeFallback />
                        </>
                    ) : chat.filter(m => m.role === 'learner').length === 0 ? (
                        <></>
                    ) : (
                        <p className="text-xs text-cream/50">Interaction recorded.</p>
                    )}
                </Card>
            )

        default:
            return (
                <Card>
                    <p className="text-sm text-cream/70">{activity.prompt ?? activity.title}</p>
                    <button onClick={() => report(true, { kind: 'info', text: 'Recorded.' })} className={`${CONTINUE} mt-4`}>Continue</button>
                </Card>
            )
    }

    /* inner helpers need access to interact for interaction types */
    function Bubble({ role, text }: { role: 'ai' | 'learner'; text: string }) {
        return (
            <div className={`flex ${role === 'learner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${role === 'learner' ? 'bg-violet-600 text-white' : 'bg-white/5 border border-white/10 text-cream/80'}`}>
                    {text}
                    {role === 'ai' && <span className="ml-2 inline-block align-middle"><SpeakerButton text={text} lang="es-ES" size="sm" /></span>}
                </div>
            </div>
        )
    }
}

const CONTINUE = 'w-full rounded-xl bg-violet-600 hover:bg-violet-500 py-3 text-sm font-bold text-white disabled:opacity-40'

function Card({ children }: { children: React.ReactNode }) {
    return <div className="rounded-2xl border border-white/10 bg-[#13131B] p-5 md:p-6">{children}</div>
}

function Situation({ text, target, onPlayed }: { text?: string; target?: string; onPlayed: () => void }) {
    return (
        <div className="mb-5 rounded-xl border border-white/10 bg-[#1A1A24] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-cream/40 mb-2">Situation</p>
            <p className="text-sm text-cream/80 leading-relaxed mb-3">{text}</p>
            {target && (
                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors" onClick={onPlayed}>
                    <SpeakerButton text={target} lang="es-ES" size="md" onStart={onPlayed} onEnd={onPlayed} />
                    <span className="text-base font-semibold text-cream">{target}</span>
                </div>
            )}
        </div>
    )
}

export default function LearnPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-[#0B0B10]" />}>
            <LearnPlayer />
        </Suspense>
    )
}