'use client'
import { useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useMic } from '@/hooks/useMic'
import { isAssessmentSession, type AssessmentSession } from '../../../../packages/contracts/assessment'

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
    const button = 'rounded-xl border border-white/20 px-4 py-3 font-semibold disabled:opacity-40'
    if (!session) return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream"><section className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-bold">{kind === 'gateway' ? 'Pre-A1 Gateway' : 'Mission assessment'}</h1>
        <p>Server-owned conversations require reviewed readiness evidence and calibrated rubrics. A fallback response can never graduate you.</p>
        {error && <p role="alert">{error}</p>}<button className={button} disabled={busy} onClick={start}>Check eligibility and start</button><button className={button} onClick={onExit}>Exit</button>
    </section></main>
    return <main className="min-h-screen bg-[#0B0B10] p-6 text-cream"><section className="mx-auto max-w-2xl space-y-5">
        <header className="flex justify-between"><div><p className="text-xs uppercase">{session.kind} · {session.scenarioNumber}/{session.scenarioTotal}</p><h1 className="text-2xl font-bold">{session.title}</h1></div><button className={button} onClick={onExit}>Exit</button></header>
        <p>{session.objective}</p><p className="text-sm text-cream/60">Status: {session.status}. Expires {new Date(session.expiresAt).toLocaleString()}.</p>
        <div className="space-y-2">{session.turns.map(turn => <p key={turn.sequence} className={`rounded-xl p-3 ${turn.role === 'learner' ? 'ml-10 bg-glow text-night-900' : 'mr-10 bg-white/10'}`}><span className="sr-only">{turn.role}: </span>{turn.text}</p>)}</div>
        {session.status === 'active' && <div className="space-y-3">
            <label className="block">Your Spanish response<input className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 p-3" value={answer} maxLength={500} onChange={event => setAnswer(event.target.value)} disabled={busy || mic.state !== 'idle'} /></label>
            <button className={button} disabled={busy || !answer.trim() || mic.state !== 'idle'} onClick={() => send(mic.recordingUrl ? 'transcript' : 'typed')}>Send raw response</button>
            <label className="flex gap-2 text-xs"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={mic.state !== 'idle'} />I consent to transcription-provider processing. Temporary server audio is deleted; the confirmed transcript is stored.</label>
            <button className={button} disabled={!consent || busy || mic.state === 'processing'} onClick={() => mic.state === 'recording' ? mic.stop() : mic.start()}>{mic.state === 'recording' ? 'Stop recording' : mic.state === 'processing' ? 'Transcribing…' : 'Record response'}</button>
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
