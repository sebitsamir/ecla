'use client'
import { useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useMic } from '@/hooks/useMic'
import { isAssessmentSession, type AssessmentSession } from '../../../../packages/contracts/assessment'
import { ArrowLeft, ArrowRight, Mic, ShieldCheck } from 'lucide-react'

type Props = { kind: 'mission' | 'gateway'; competencyId?: string; getToken: () => Promise<string | null>; onExit: () => void }
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
        const result = await apiFetch<unknown>(path, getToken, body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(30000) })
        if (!isAssessmentSession(result)) throw new Error('Unsupported assessment contract')
        setSession(result); return result
    }
    const run = async (action: () => Promise<void>) => {
        if (working.current) return
        working.current = true; setBusy(true); setError(null)
        try { await action() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Assessment request failed') }
        finally { working.current = false; setBusy(false) }
    }
    const start = () => run(async () => { await request(kind === 'gateway' ? '/api/v1/gateway/sessions' : `/api/v1/missions/${encodeURIComponent(competencyId!)}/sessions`, { idempotencyKey: startKey.current }) })
    const send = (source: 'typed' | 'transcript') => run(async () => {
        if (!session || !answer.trim()) return
        const payload = pending.current?.text === answer.trim() && pending.current.source === source ? pending.current : { responseKey: crypto.randomUUID(), text: answer.trim(), source }
        pending.current = payload; await request(`/api/v1/assessment-sessions/${session.id}/turns`, payload)
        pending.current = null; setAnswer('')
    })
    const evaluate = () => run(async () => { if (session) await request(`/api/v1/assessment-sessions/${session.id}/evaluate`, {}) })
    const finalize = () => run(async () => { if (session) await request(`/api/v1/assessment-sessions/${session.id}/finalize`, {}) })
    const button = 'ecla-control min-h-12 rounded-control border border-line-strong px-4 py-3 font-semibold hover:border-ember/50 hover:bg-ember/10 disabled:opacity-40'
    if (!session) return <main className="relative min-h-dvh overflow-hidden bg-obsidian p-4 text-ivory sm:p-8"><div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,10,.25),rgba(9,9,10,.9)),url('/worlds/spanish-night-v1.webp')] bg-cover bg-center" /><section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col justify-between rounded-experience border border-line bg-obsidian/60 p-6 shadow-glow-md backdrop-blur-sm sm:p-10">
        <button className="ecla-control inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line-strong bg-black/30 px-4 text-sm" onClick={onExit}><ArrowLeft className="size-4" />Exit</button>
        <div className="max-w-2xl py-16"><p className="text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">{kind === 'gateway' ? 'Gateway' : 'Real-world mission'}</p><h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">{kind === 'gateway' ? 'Pre-A1 Gateway' : 'Show what you can do.'}</h1>
        <p className="mt-5 max-w-xl leading-relaxed text-stone">This server-owned conversation uses reviewed readiness evidence and calibrated rubrics. A fallback response cannot graduate you.</p></div>
        {error && <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 p-4 text-danger-soft">{error}</p>}<button className={`${button} flex w-full items-center justify-center gap-2 bg-ember text-obsidian hover:bg-ember-soft`} disabled={busy} onClick={start}>Check eligibility and start <ArrowRight className="size-4" /></button>
    </section></main>
    return <main className="min-h-dvh bg-[radial-gradient(circle_at_70%_0%,rgba(255,122,61,.12),transparent_30rem),#09090a] p-4 text-ivory sm:p-7"><section className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">{session.kind} · Scene {session.scenarioNumber} of {session.scenarioTotal}</p><h1 className="font-display mt-2 text-3xl sm:text-4xl">{session.title}</h1></div><button className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong" aria-label="Exit assessment" onClick={onExit}><ArrowLeft className="size-4" /></button></header>
        <div className="rounded-experience border border-line bg-surface p-5"><p className="text-sm font-semibold text-ivory">Your objective</p><p className="mt-2 text-stone">{session.objective}</p><p className="mt-4 flex items-center gap-2 text-xs text-ash"><ShieldCheck className="size-4 text-success" />{session.status} · expires {new Date(session.expiresAt).toLocaleString()}</p></div>
        <div className="space-y-3">{session.turns.map(turn => <p key={turn.sequence} className={`max-w-[88%] rounded-[1.25rem] p-4 leading-relaxed ${turn.role === 'learner' ? 'ml-auto rounded-br-sm bg-ember text-obsidian' : 'mr-auto rounded-bl-sm border border-line bg-carbon'}`}><span className="sr-only">{turn.role}: </span>{turn.text}</p>)}</div>
        {session.status === 'active' && <div className="space-y-3">
            <label className="block text-sm font-medium">Your Spanish response<input className="mt-2 min-h-12 w-full rounded-control border border-line-strong bg-carbon px-4" placeholder="Type your response…" value={answer} maxLength={500} onChange={event => setAnswer(event.target.value)} disabled={busy || mic.state !== 'idle'} /></label>
            <button className={`${button} flex w-full items-center justify-center gap-2 bg-ember text-obsidian hover:bg-ember-soft`} disabled={busy || !answer.trim() || mic.state !== 'idle'} onClick={() => send(mic.recordingUrl ? 'transcript' : 'typed')}>Send raw response <ArrowRight className="size-4" /></button>
            <label className="flex gap-2 text-xs"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={mic.state !== 'idle'} />I consent to transcription-provider processing. Temporary server audio is deleted; the confirmed transcript is stored.</label>
            <button className={`${button} inline-flex items-center gap-2`} disabled={!consent || busy || mic.state === 'processing'} onClick={() => mic.state === 'recording' ? mic.stop() : mic.start()}><Mic className="size-4" />{mic.state === 'recording' ? 'Stop recording' : mic.state === 'processing' ? 'Transcribing…' : 'Record response'}</button>
            {mic.recordingUrl && <audio controls src={mic.recordingUrl} aria-label="Recording playback" />}
            {mic.error && <p role="status">Voice unavailable. Typing remains available.</p>}
            <p className="text-xs text-cream/60">Review the transcript before sending. A transcript is not pronunciation or acoustic evidence.</p>
            <button className={button} disabled={busy || !session.turns.some(turn => turn.role === 'learner')} onClick={evaluate}>Evaluate saved turns</button>
        </div>}
        {session.result && <div className="space-y-2 rounded-xl border border-white/20 p-4"><h2 className="font-bold">Server result</h2><p>Objective: {session.result.objectiveAchieved ? 'observed in text' : 'not established'}. Confidence: {Math.round(session.result.confidence * 100)}%.</p><p>{session.result.explanation}</p><p>Intelligibility: {session.result.intelligibility === null ? 'No acoustic evidence' : `${Math.round(session.result.intelligibility * 100)}%`}.</p></div>}
        {session.status === 'awaiting_review' && <><p role="status">Human review with consented acoustic evidence is required before a Gateway pass.</p>{kind === 'gateway' && <button className={button} disabled={busy} onClick={finalize}>Check final review decision</button>}</>}
        {session.finalDecision && <div role="status" className="rounded-xl border p-4"><p>{session.finalDecision.passed ? 'Gateway passed' : 'Gateway not passed'} · {session.finalDecision.passedScenarios}/{session.finalDecision.required} required · {Math.round(session.finalDecision.confidence * 100)}% confidence.</p><p>{session.finalDecision.explanation}</p></div>}
        {error && <p role="alert">{error}</p>}{busy && <p role="status">Saving…</p>}
    </section></main>
}
