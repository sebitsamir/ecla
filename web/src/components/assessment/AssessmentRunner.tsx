'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, Clock3, Headphones, Keyboard, Mic, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { useMic } from '@/hooks/useMic'
import { isAssessmentSession, type AssessmentSession } from '../../../../packages/contracts/assessment'

type Props = { kind: 'mission' | 'gateway'; competencyId?: string; getToken: () => Promise<string | null>; onExit: () => void }
const primary = 'ecla-control inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-ember px-5 text-sm font-semibold text-obsidian hover:bg-ember-soft disabled:cursor-not-allowed disabled:opacity-40'
const quiet = 'ecla-control inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line-strong bg-black/20 px-4 text-sm font-medium text-ivory hover:border-ember/45 hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-40'

function ProgressLine({ current, total }: { current: number; total: number }) {
    const width = Math.max(0, Math.min(100, (current / Math.max(total, 1)) * 100))
    return <div className="h-1 overflow-hidden rounded-full bg-white/10" aria-label={`Scene ${current} of ${total}`}><div className="h-full rounded-full bg-gradient-to-r from-ember to-ember-soft transition-[width] duration-500" style={{ width: `${width}%` }} /></div>
}

export default function AssessmentRunner({ kind, competencyId, getToken, onExit }: Props) {
    const [session, setSession] = useState<AssessmentSession | null>(null)
    const [answer, setAnswer] = useState('')
    const [consent, setConsent] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const working = useRef(false)
    const startKey = useRef(crypto.randomUUID())
    const pending = useRef<{ responseKey: string; text: string; source: 'typed' | 'transcript' } | null>(null)
    const mic = useMic(getToken, value => setAnswer(value))

    const request = async (path: string, body?: unknown) => {
        const result = await apiFetch<unknown>(path, getToken, body === undefined
            ? { signal: AbortSignal.timeout(30000) }
            : { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(30000) })
        if (!isAssessmentSession(result)) throw new Error('The assessment response could not be verified.')
        setSession(result)
        return result
    }
    const run = async (action: () => Promise<void>) => {
        if (working.current) return
        working.current = true
        setBusy(true)
        setError(null)
        try { await action() }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not continue the assessment.') }
        finally { working.current = false; setBusy(false) }
    }
    const start = () => run(async () => {
        const path = kind === 'gateway' ? '/api/v1/gateway/sessions' : `/api/v1/missions/${encodeURIComponent(competencyId!)}/sessions`
        await request(path, { idempotencyKey: startKey.current })
    })
    const send = (source: 'typed' | 'transcript') => run(async () => {
        if (!session || !answer.trim()) return
        const text = answer.trim()
        const payload = pending.current?.text === text && pending.current.source === source ? pending.current : { responseKey: crypto.randomUUID(), text, source }
        pending.current = payload
        await request(`/api/v1/assessment-sessions/${session.id}/turns`, payload)
        pending.current = null
        setAnswer('')
    })
    const evaluate = () => run(async () => { if (session) await request(`/api/v1/assessment-sessions/${session.id}/evaluate`, {}) })
    const refresh = () => run(async () => {
        if (!session) return
        const current = await request(`/api/v1/assessment-sessions/${session.id}`)
        if (kind === 'gateway' && current.status === 'awaiting_review' && !current.finalDecision) {
            try { await request(`/api/v1/assessment-sessions/${session.id}/finalize`, {}) }
            catch (reason) {
                // A conflict here means one or more human reviews are still pending.
                if (!(reason instanceof ApiError && reason.kind === 'conflict')) throw reason
            }
        }
    })

    if (!session) {
        const mission = kind === 'mission'
        return (
            <main className="relative min-h-dvh overflow-hidden bg-obsidian text-ivory">
                <div aria-hidden className={`absolute inset-0 bg-cover bg-center ${mission ? "bg-[url('/worlds/journey/unit-everyday-survival.webp')]" : "bg-[url('/worlds/spanish-night-v1.webp')]"}`} />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,10,.96)_0%,rgba(9,9,10,.78)_48%,rgba(9,9,10,.35)_100%),linear-gradient(0deg,rgba(9,9,10,.9),transparent_55%)]" />
                <div className="relative mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
                    <button className={quiet} onClick={onExit}><ArrowLeft className="size-4" />Back to journey</button>
                    <section className="my-auto max-w-2xl py-14 sm:py-20">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-ember-soft"><Sparkles className="size-4" />{mission ? 'Mission' : 'Pre-A1 Gateway'}</p>
                        <h1 className="font-display mt-4 text-5xl leading-[.98] text-ivory sm:text-7xl">{mission ? 'Take your Spanish into real life.' : 'Show what you can do.'}</h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-cream/75 sm:text-lg">{mission
                            ? 'One situation. One clear outcome. Respond in your own words and let the conversation unfold.'
                            : 'Move through seven short, everyday conversations. Your progress is measured from what you communicate independently.'}</p>
                        <dl className="mt-8 grid max-w-xl gap-3 border-y border-white/15 py-5 text-sm sm:grid-cols-3">
                            <div><dt className="text-[10px] uppercase tracking-[.16em] text-ash">Format</dt><dd className="mt-1 text-ivory">{mission ? '1 situation' : '7 situations'}</dd></div>
                            <div><dt className="text-[10px] uppercase tracking-[.16em] text-ash">Responses</dt><dd className="mt-1 text-ivory">Speak or type</dd></div>
                            <div><dt className="text-[10px] uppercase tracking-[.16em] text-ash">Evidence</dt><dd className="mt-1 text-ivory">Reviewed</dd></div>
                        </dl>
                        <div className="mt-7 flex max-w-xl items-start gap-3 rounded-surface border border-white/10 bg-black/30 p-4 text-xs leading-5 text-stone backdrop-blur-sm">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                            <p>Ecla checks reviewed readiness before opening this assessment. Results remain pending until the required human and acoustic review is complete.</p>
                        </div>
                        {error ? <p role="alert" className="mt-4 flex max-w-xl items-start gap-2 rounded-control border border-danger/35 bg-danger/10 p-4 text-sm text-danger-soft"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p> : null}
                        <button className={`${primary} mt-7 w-full max-w-xl sm:w-auto`} disabled={busy} onClick={start}>{busy ? 'Checking readiness…' : mission ? 'Enter the mission' : 'Begin Gateway'}<ArrowRight className="size-4" /></button>
                    </section>
                    <p className="max-w-xl pb-3 text-xs leading-5 text-ash">No direct translation during assessment. Ask for repetition when you need it; repairing a conversation is a real language skill.</p>
                </div>
            </main>
        )
    }

    const learnerTurns = session.turns.filter(turn => turn.role === 'learner').length
    const awaitingReview = session.status === 'awaiting_review'
    const completed = session.status === 'completed'
    const expired = session.status === 'expired'

    return (
        <main className="relative min-h-dvh overflow-hidden bg-obsidian text-ivory">
            <div aria-hidden className="fixed inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(255,122,61,.13),transparent_30rem),linear-gradient(145deg,#101114,#09090a_62%)]" />
            <div className="relative mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-4 py-4 sm:px-7 sm:py-6 lg:px-10">
                <header className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-line pb-4 sm:gap-5">
                    <button className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-black/20" aria-label="Exit assessment" onClick={onExit}><ArrowLeft className="size-4" /></button>
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.16em] text-stone"><span className="truncate">{session.kind === 'gateway' ? 'Pre-A1 Gateway' : 'Mission'}</span><span className="shrink-0">{session.scenarioNumber} / {session.scenarioTotal}</span></div>
                        <div className="mt-2"><ProgressLine current={session.scenarioNumber} total={session.scenarioTotal} /></div>
                    </div>
                    <span className="hidden items-center gap-2 text-xs text-ash sm:flex"><Clock3 className="size-4" />2-hour session</span>
                </header>

                {awaitingReview || completed || expired ? (
                    <ResultState session={session} busy={busy} error={error} onRefresh={refresh} onExit={onExit} />
                ) : (
                    <div className="grid min-w-0 flex-1 gap-6 py-6 lg:grid-cols-[minmax(17rem,.72fr)_minmax(0,1.28fr)] lg:gap-10 lg:py-8">
                        <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
                            <p className="text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">Your situation</p>
                            <h1 className="font-display mt-3 break-words text-4xl leading-[1.02] sm:text-5xl">{session.title}</h1>
                            <div className="mt-6 border-l border-ember/50 pl-5"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ash">Your objective</p><p className="mt-2 text-base leading-7 text-cream">{session.objective}</p></div>
                            <ul className="mt-7 space-y-3 text-xs leading-5 text-stone">
                                <li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-success" />Use the Spanish you already have.</li>
                                <li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-success" />Ask for repetition if you need it.</li>
                                <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-ember-soft" />Evaluation comes from saved turns on the server.</li>
                            </ul>
                        </aside>
                        <Conversation session={session} answer={answer} setAnswer={setAnswer} consent={consent} setConsent={setConsent} busy={busy} error={error} mic={mic} learnerTurns={learnerTurns} onSend={send} onEvaluate={evaluate} />
                    </div>
                )}
            </div>
        </main>
    )
}

type MicController = ReturnType<typeof useMic>

function Conversation({ session, answer, setAnswer, consent, setConsent, busy, error, mic, learnerTurns, onSend, onEvaluate }: {
    session: AssessmentSession; answer: string; setAnswer: (value: string) => void
    consent: boolean; setConsent: (value: boolean) => void; busy: boolean; error: string | null
    mic: MicController; learnerTurns: number; onSend: (source: 'typed' | 'transcript') => void; onEvaluate: () => void
}) {
    return (
        <section className="flex min-w-0 flex-col rounded-experience border border-line bg-surface/70 shadow-glow-md backdrop-blur-sm lg:min-h-[70vh]">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {session.turns.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center"><span className="flex size-12 items-center justify-center rounded-full border border-line bg-carbon text-ember-soft"><Sparkles className="size-5" /></span><p className="font-display mt-4 text-2xl">The scene is yours.</p><p className="mt-2 max-w-sm text-sm leading-6 text-stone">Begin naturally in Spanish. The person in the situation will respond.</p></div>
                    : session.turns.map(turn => <div key={turn.sequence} className={`flex ${turn.role === 'learner' ? 'justify-end' : 'justify-start'}`}><p className={`max-w-[92%] break-words rounded-[1.25rem] px-4 py-3 text-sm leading-6 sm:max-w-[78%] sm:px-5 ${turn.role === 'learner' ? 'rounded-br-sm bg-ember text-obsidian' : 'rounded-bl-sm border border-line bg-carbon text-cream'}`}><span className="sr-only">{turn.role}: </span>{turn.text}</p></div>)}
                {busy ? <p role="status" className="flex items-center gap-2 text-xs text-ash"><span className="ecla-loading-mark scale-75 text-ember-soft" />The conversation is responding…</p> : null}
            </div>
            <div className="border-t border-line p-4 sm:p-5">
                <label htmlFor="assessment-response" className="text-xs font-medium text-stone">Your Spanish response</label>
                <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
                    <textarea id="assessment-response" rows={2} className="min-h-12 min-w-0 flex-1 resize-none rounded-control border border-line-strong bg-carbon px-4 py-3 text-sm text-ivory outline-none placeholder:text-ash focus:border-ember/60" placeholder="Respond in your own words…" value={answer} maxLength={500} onChange={event => setAnswer(event.target.value)} disabled={busy || mic.state !== 'idle'} />
                    <button className={`${primary} shrink-0 sm:self-stretch`} disabled={busy || !answer.trim() || mic.state !== 'idle'} onClick={() => onSend(mic.recordingUrl ? 'transcript' : 'typed')}>Send <ArrowRight className="size-4" /></button>
                </div>
                <div className="mt-4 grid min-w-0 gap-3 border-t border-line pt-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-xs leading-5 text-stone"><input className="mt-1 accent-[#ff7a3d]" type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={mic.state !== 'idle'} /><span>I consent to transcription-provider processing. Temporary server audio is deleted; only my confirmed transcript is stored.</span></label>
                        {mic.recordingUrl ? <audio className="mt-2 h-9 w-full max-w-sm" controls src={mic.recordingUrl} aria-label="Recording playback" /> : null}
                        {mic.error ? <p role="status" className="mt-2 text-xs text-warning">Voice is unavailable. You can continue by typing.</p> : null}
                    </div>
                    <button className={quiet} disabled={!consent || busy || mic.state === 'processing'} onClick={() => mic.state === 'recording' ? mic.stop() : mic.start()}>{mic.state === 'recording' ? <><Headphones className="size-4" />Stop and transcribe</> : mic.state === 'processing' ? <><span className="ecla-loading-mark scale-75" />Transcribing…</> : <><Mic className="size-4" />Speak response</>}</button>
                </div>
                <p className="mt-3 flex items-center gap-2 text-[10px] leading-4 text-ash"><Keyboard className="size-3.5 shrink-0" />Review any transcript before sending. A transcript alone is not pronunciation evidence.</p>
                <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-ash">{learnerTurns === 0 ? 'Complete the objective before finishing.' : `${learnerTurns} ${learnerTurns === 1 ? 'response' : 'responses'} saved`}</p><button className={quiet} disabled={busy || learnerTurns === 0} onClick={onEvaluate}>Finish this scene <ArrowRight className="size-4" /></button></div>
                {error ? <p role="alert" className="mt-4 flex items-start gap-2 rounded-control border border-danger/35 bg-danger/10 p-3 text-sm text-danger-soft"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p> : null}
            </div>
        </section>
    )
}

function ResultState({ session, busy, error, onRefresh, onExit }: { session: AssessmentSession; busy: boolean; error: string | null; onRefresh: () => void; onExit: () => void }) {
    const expired = session.status === 'expired'
    const completed = session.status === 'completed'
    return (
        <section className="my-auto mx-auto w-full max-w-2xl py-14 text-center">
            <span className={`mx-auto flex size-16 items-center justify-center rounded-full border ${completed && session.finalDecision?.passed ? 'border-success/35 bg-success/10 text-success' : expired ? 'border-danger/35 bg-danger/10 text-danger-soft' : 'border-ember/35 bg-ember/10 text-ember-soft'}`}>{completed && session.finalDecision?.passed ? <Check className="size-7" /> : expired ? <Clock3 className="size-7" /> : <ShieldCheck className="size-7" />}</span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.22em] text-ember-soft">{expired ? 'Session ended' : completed ? 'Decision ready' : 'Evidence received'}</p>
            <h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">{expired ? 'Your session expired.' : completed ? (session.finalDecision?.passed ? 'You did it.' : 'Keep building from here.') : 'Your review is in progress.'}</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-stone sm:text-base">{expired ? 'Return to your journey when you are ready to begin a fresh assessment.' : session.finalDecision?.explanation ?? 'A qualified reviewer must confirm the saved evidence before this result can change your learner record.'}</p>
            {session.result ? <div className="mt-8 grid grid-cols-2 gap-3 rounded-surface border border-line bg-surface p-4 text-left sm:grid-cols-4 sm:p-5">
                <div><p className="text-[9px] uppercase tracking-[.13em] text-ash">Objective</p><p className="mt-1 text-sm text-ivory">{session.result.objectiveAchieved ? 'Observed' : 'Not established'}</p></div>
                <div><p className="text-[9px] uppercase tracking-[.13em] text-ash">Meaning</p><p className="mt-1 text-sm text-ivory">{session.result.meaningCommunicated ? 'Communicated' : 'Still forming'}</p></div>
                <div><p className="text-[9px] uppercase tracking-[.13em] text-ash">Confidence</p><p className="mt-1 text-sm text-ivory">{Math.round(session.result.confidence * 100)}%</p></div>
                <div><p className="text-[9px] uppercase tracking-[.13em] text-ash">Speech</p><p className="mt-1 text-sm text-ivory">{session.result.intelligibility == null ? 'Review needed' : `${Math.round(session.result.intelligibility * 100)}%`}</p></div>
            </div> : null}
            {session.finalDecision ? <p className="mt-4 text-sm text-stone">{session.finalDecision.passedScenarios} of {session.finalDecision.required} required scenarios approved · {Math.round(session.finalDecision.confidence * 100)}% confidence</p> : null}
            {error ? <p role="alert" className="mt-5 rounded-control border border-danger/35 bg-danger/10 p-4 text-sm text-danger-soft">{error}</p> : null}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{session.status === 'awaiting_review' ? <button className={quiet} disabled={busy} onClick={onRefresh}><RotateCcw className="size-4" />{busy ? 'Checking…' : 'Check review status'}</button> : null}<button className={primary} onClick={onExit}>Return to journey <ArrowRight className="size-4" /></button></div>
        </section>
    )
}
