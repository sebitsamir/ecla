'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useMic } from '@/hooks/useMic'
import { GoldenResultPanel } from './GoldenResultPanel'
import { ScenePrompt } from '@/components/scenes/ScenePrompt'
import { SceneWorld } from '@/components/scenes/SceneWorld'
import { GOLDEN_CONTRACT, type GoldenAttempt, type GoldenCatalog, type GoldenResult } from '../../../../packages/contracts/golden'

type Props = { getToken: () => Promise<string | null>; onExit: () => void }
const button = 'rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-40'

export default function GoldenJourney({ getToken, onExit }: Props) {
    const [catalog, setCatalog] = useState<GoldenCatalog | null>(null)
    const [attempt, setAttempt] = useState<GoldenAttempt | null>(null)
    const [answer, setAnswer] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [consent, setConsent] = useState(false)
    const [resumed, setResumed] = useState(false)
    const working = useRef(false)
    const pendingResponse = useRef<{ sequence: number; answer: string; responseKey: string } | null>(null)
    const startKeys = useRef(new Map<string, string>())
    const taskRef = useRef<HTMLHeadingElement>(null)
    const mic = useMic(getToken, setAnswer)

    const request = useCallback(async <T,>(path: string, body?: unknown): Promise<T> => {
        const response = await apiFetch<T & { contract?: string }>(path, getToken, {
            ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(15000),
        })
        if (response.contract && response.contract !== GOLDEN_CONTRACT) throw new Error('Unsupported scene contract. Please refresh.')
        return response
    }, [getToken])

    const load = useCallback(async () => {
        const next = await request<GoldenCatalog>('/api/v1/attempts/golden')
        setCatalog(next)
        if (next.activeAttemptId) setAttempt(await request<GoldenAttempt>(`/api/v1/attempts/${next.activeAttemptId}`))
        else setAttempt(null)
    }, [request])

    useEffect(() => {
        let cancelled = false
        request<GoldenCatalog>('/api/v1/attempts/golden').then(async next => {
            const active = next.activeAttemptId ? await request<GoldenAttempt>(`/api/v1/attempts/${next.activeAttemptId}`) : null
            if (!cancelled) { setCatalog(next); setAttempt(active); setResumed(!!active) }
        }).catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load your greeting journey.') })
        return () => { cancelled = true; window.speechSynthesis?.cancel() }
    }, [request])

    useEffect(() => { taskRef.current?.focus() }, [attempt?.id, attempt?.sequence])

    const run = async (action: () => Promise<void>) => {
        if (working.current) return
        working.current = true; setBusy(true); setError(null)
        try { await action() } catch (reason) { setError(reason instanceof Error ? reason.message : 'The request failed. Reload your saved attempt to continue.') }
        finally { working.current = false; setBusy(false) }
    }

    const start = (sceneVersionId: string) => run(async () => {
        const idempotencyKey = startKeys.current.get(sceneVersionId) ?? crypto.randomUUID()
        startKeys.current.set(sceneVersionId, idempotencyKey)
        setAttempt(await request<GoldenAttempt>('/api/v1/attempts/start', { sceneVersionId, idempotencyKey }))
        setAnswer(''); setFeedback(null); setResumed(false); pendingResponse.current = null
    })

    const respond = (text: string) => run(async () => {
        if (!attempt || mic.state !== 'idle') return
        const previous = pendingResponse.current
        const payload = previous?.sequence === attempt.sequence && previous.answer === text
            ? previous : { sequence: attempt.sequence, answer: text, responseKey: crypto.randomUUID() }
        pendingResponse.current = payload
        const response = await request<{ attempt: GoldenAttempt; feedback: { correct: boolean; supported: boolean } }>(`/api/v1/attempts/${attempt.id}/responses`, payload)
        setAttempt(response.attempt); pendingResponse.current = null; setAnswer('')
        setFeedback(response.feedback.correct ? (response.feedback.supported ? 'Meaning matched with support; independent evidence is still needed.' : 'Response recorded.') : 'Meaning did not match this task. Continue, then revisit this context for practice.')
    })

    const complete = () => run(async () => {
        if (!attempt || mic.state !== 'idle') return
        const result = await request<GoldenResult>(`/api/v1/attempts/${attempt.id}/complete`, {})
        setAttempt({ ...attempt, status: 'completed', result })
        startKeys.current.clear()
        window.dispatchEvent(new Event('ecla:progress-updated'))
    })


    return <main className="min-h-screen bg-[#0B0B10] px-4 py-6 text-cream">
        <div className="mx-auto max-w-2xl space-y-6">
            <header className="flex items-center justify-between gap-4"><button className={button} onClick={onExit}>Exit to course</button><p className="text-xs uppercase tracking-widest">First contact · Greeting pilot</p></header>
            <p className="rounded-xl border border-amber-200/20 p-4 text-sm text-cream/70">Server-owned responses · Text-mediated assessment · Recorded reference audio and educator review pending. Browser speech is a fallback; no pronunciation score is awarded.</p>
            {error && <div role="alert" className="space-y-3 rounded-xl border border-red-300/30 p-4"><p>{error}</p><button className={button} disabled={busy || mic.state !== 'idle'} onClick={() => run(load)}>Reload saved state</button></div>}
            {!catalog && !error && <p role="status">Loading greeting scenes…</p>}
            {catalog && !attempt && <section className="space-y-4">
                <h1 className="text-3xl font-bold">Greet someone in Spanish</h1>
                <p className="text-cream/70">Practice in three places, then respond in a new setting. Retention opens only after a successful transfer and a full day without starting more greeting practice.</p>
                {!catalog.scenes.length && <p role="status">Golden scenes have not been installed in this database yet. Apply the Phase 1 migration and golden seed before using this pilot.</p>}
                {catalog.scenes.map(scene => <article key={scene.id} className="space-y-3 rounded-2xl border border-white/10 p-5">
                    <p className="text-xs uppercase text-cream/50">{scene.purpose}{scene.completed ? ' · completed' : ''}</p>
                    <h2 className="text-xl font-semibold">{scene.title}</h2><p className="text-sm text-cream/70">{scene.setting}</p>
                    {scene.reason && <p className="text-sm text-amber-200">{scene.reason}</p>}
                    <button className={button} disabled={busy || !scene.available} onClick={() => start(scene.id)}>{scene.completed ? 'Practice again' : 'Begin scene'}</button>
                </article>)}
            </section>}
            {attempt?.status === 'expired' && <section><p>This attempt expired. Your existing responses remain stored; begin a fresh attempt to continue.</p><button className={button} onClick={() => run(load)}>Back to scenes</button></section>}
            {attempt?.status === 'active' && <section className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
                {resumed && <p role="status" className="rounded-xl border border-leaf/25 bg-leaf/5 p-3 text-sm text-leaf">Welcome back. Your saved responses are intact; continue at task {attempt.sequence + 1}.</p>}
                <SceneWorld setting={attempt.scene.setting} speaker={attempt.step?.speaker} title={attempt.scene.title} />
                <progress aria-label="Scene progress" className="w-full" value={attempt.sequence} max={attempt.totalSteps} />
                {attempt.step ? <>
                    <p className="text-xs uppercase text-cream/60">{attempt.step.stage} · Task {attempt.sequence + 1} of {attempt.totalSteps}</p>
                    <h2 ref={taskRef} tabIndex={-1} className="text-lg font-semibold focus:outline-none">{attempt.step.prompt}</h2>
                    <ScenePrompt step={attempt.step} hideHeading />
                    {attempt.step.kind === 'encounter' && <button className={button} disabled={busy} onClick={() => respond('continue')}>Continue</button>}
                    {attempt.step.kind === 'choice' && <div className="grid gap-3">{attempt.step.options?.map(option => <button key={option.id} className={`${button} text-left`} disabled={busy} onClick={() => respond(option.id)}>{option.label}</button>)}</div>}
                    {attempt.step.kind === 'response' && <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (answer.trim()) respond(answer.trim()) }}>
                        <label className="block space-y-2"><span>Your Spanish response</span><input className="w-full rounded-xl border border-white/20 bg-black/30 p-3" value={answer} maxLength={300} onChange={event => setAnswer(event.target.value)} autoComplete="off" disabled={busy} /></label>
                        <button className={button} disabled={busy || !answer.trim() || mic.state !== 'idle'} type="submit">Send response</button>
                        <label className="flex items-start gap-3 text-xs text-cream/70"><input type="checkbox" checked={consent} disabled={mic.state !== 'idle'} onChange={event => setConsent(event.target.checked)} />I consent to sending this recording to the transcription provider. Temporary server audio is deleted; my text response is saved with this attempt. Typing is always available.</label>
                        <button className={button} type="button" disabled={!consent || busy || mic.state === 'processing'} onClick={() => mic.state === 'recording' ? mic.stop() : mic.start()}>{mic.state === 'recording' ? 'Stop recording' : mic.state === 'processing' ? 'Transcribing…' : 'Record instead (up to 60 seconds)'}</button>
                        {mic.recordingUrl && <audio controls src={mic.recordingUrl} aria-label="Play back your recording" className="max-w-full" />}
                        {mic.error && <p role="status" className="text-sm text-amber-200">Voice is unavailable. You can type your response or retry the microphone.</p>}
                        <p className="text-xs text-cream/60">Check the recognized text before sending. Transcription is not a pronunciation assessment.</p>
                    </form>}
                    {attempt.step.kind !== 'encounter' && <button className={button} disabled={busy} onClick={() => run(async () => setAttempt(await request<GoldenAttempt>(`/api/v1/attempts/${attempt.id}/support`, { sequence: attempt.sequence })))}>Show support (records assisted performance)</button>}
                    {attempt.support && <p className="rounded-xl border border-amber-200/30 p-4" lang="es">{attempt.support}</p>}
                </> : <><p>All responses are saved. Complete the attempt to calculate its evidence once.</p><button className={button} disabled={busy} onClick={complete}>Complete attempt</button></>}
            </section>}
            {feedback && <p role="status" aria-live="polite" className="text-sm text-cream/70">{feedback}</p>}
            {attempt?.result && <><GoldenResultPanel result={attempt.result} /><button className={button} disabled={busy || mic.state !== 'idle'} onClick={() => run(load)}>Choose next scene</button></>}
            {busy && <p role="status">Saving…</p>}
        </div>
    </main>
}
