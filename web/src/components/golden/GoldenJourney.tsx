'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useMic } from '@/hooks/useMic'
import { GoldenResultPanel } from './GoldenResultPanel'
import { ScenePrompt } from '@/components/scenes/ScenePrompt'
import { SceneWorld } from '@/components/scenes/SceneWorld'
import { GOLDEN_CONTRACT, type GoldenAttempt, type GoldenCatalog, type GoldenResult } from '../../../../packages/contracts/golden'
import { ArrowLeft, ArrowRight, Lightbulb, Mic, ShieldCheck } from 'lucide-react'

type Props = { competencyCode: string; getToken: () => Promise<string | null>; onExit: () => void }
const button = 'ecla-control min-h-12 rounded-control border border-line-strong px-4 py-3 text-sm font-semibold hover:border-ember/50 hover:bg-ember/10 disabled:opacity-40'

export default function GoldenJourney({ competencyCode, getToken, onExit }: Props) {
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
        const next = await request<GoldenCatalog>(`/api/v1/attempts/golden?competencyCode=${encodeURIComponent(competencyCode)}`)
        setCatalog(next)
        if (next.activeAttemptId) setAttempt(await request<GoldenAttempt>(`/api/v1/attempts/${next.activeAttemptId}`))
        else setAttempt(null)
    }, [competencyCode, request])

    useEffect(() => {
        let cancelled = false
        request<GoldenCatalog>(`/api/v1/attempts/golden?competencyCode=${encodeURIComponent(competencyCode)}`).then(async next => {
            const active = next.activeAttemptId ? await request<GoldenAttempt>(`/api/v1/attempts/${next.activeAttemptId}`) : null
            if (!cancelled) { setCatalog(next); setAttempt(active); setResumed(!!active) }
        }).catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load this benchmark journey.') })
        return () => { cancelled = true; window.speechSynthesis?.cancel() }
    }, [competencyCode, request])

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


    return <main className="min-h-dvh bg-obsidian text-ivory">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-7">
            <header className="flex items-center justify-between gap-4"><button className="ecla-control inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm text-stone hover:text-ivory" onClick={onExit}><ArrowLeft className="size-4" />Course</button><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-stone">Evidence benchmark · {competencyCode}</p></header>
            <p className="flex items-start gap-3 rounded-control border border-line bg-surface p-4 text-sm leading-relaxed text-stone"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" /><span>Responses are evaluated by the server as text. Browser speech supports listening and transcription; it does not produce a pronunciation score. Educator review remains separate.</span></p>
            {error && <div role="alert" className="space-y-3 rounded-control border border-danger/40 bg-danger/10 p-4 text-danger-soft"><p>{error}</p><button className={button} disabled={busy || mic.state !== 'idle'} onClick={() => run(load)}>Reload saved state</button></div>}
            {!catalog && !error && <p role="status">Loading benchmark scenes…</p>}
            {catalog && !attempt && <section className="pb-10">
                <div className="max-w-2xl pb-9 pt-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-ember-soft">Practice, transfer, retain</p><h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">Use this ability in context.</h1>
                <p className="mt-4 leading-relaxed text-stone">Practise in developed situations, then respond in held-out settings. Support, modality, context, and delayed return are recorded separately.</p></div>
                {!catalog.scenes.length && <p role="status">Benchmark lessons are not installed in this release yet. Run the release seed against the deployed database, then reload this page.</p>}
                <div className="grid gap-4 md:grid-cols-3">{catalog.scenes.map((scene, index) => <article key={scene.id} className="relative flex min-h-60 flex-col overflow-hidden rounded-experience border border-line bg-carbon p-6 shadow-glow-md">
                    <div className="relative flex h-full flex-col">
                    <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">{scene.purpose} · {String(index + 1).padStart(2,'0')}{scene.completed ? ' · completed' : ''}</p>
                    <h2 className="font-display mt-8 text-2xl">{scene.title}</h2><p className="mt-2 text-sm text-stone">{scene.setting}</p>
                    {scene.reason && <p className="text-sm text-amber-200">{scene.reason}</p>}
                    <button className={`${button} mt-auto flex w-full items-center justify-center gap-2 bg-ember text-obsidian hover:bg-ember-soft`} disabled={busy || !scene.available} onClick={() => start(scene.id)}>{scene.completed ? 'Practice again' : 'Begin scene'} <ArrowRight className="size-4" /></button></div>
                </article>)}</div>
            </section>}
            {attempt?.status === 'expired' && <section><p>This attempt expired. Your existing responses remain stored; begin a fresh attempt to continue.</p><button className={button} onClick={() => run(load)}>Back to scenes</button></section>}
            {attempt?.status === 'active' && <section className="overflow-hidden rounded-experience border border-line bg-carbon shadow-[0_30px_100px_rgba(0,0,0,.45)]">
                {resumed && <p role="status" className="rounded-xl border border-leaf/25 bg-leaf/5 p-3 text-sm text-leaf">Welcome back. Your saved responses are intact; continue at task {attempt.sequence + 1}.</p>}
                <SceneWorld setting={attempt.scene.setting} speaker={attempt.step?.speaker} title={attempt.scene.title} />
                <div className="relative -mt-16 space-y-5 p-5 sm:-mt-24 sm:p-8"><div className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-ember" style={{width: `${Math.min(100, (attempt.sequence / attempt.totalSteps) * 100)}%`}} /></div>
                {attempt.step ? <div key={attempt.step.id} className="animate-fade-up space-y-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">{attempt.step.stage} · Task {attempt.sequence + 1} of {attempt.totalSteps}</p>
                    <h2 ref={taskRef} tabIndex={-1} className="font-display text-2xl leading-tight focus:outline-none sm:text-3xl">{attempt.step.prompt}</h2>
                    <ScenePrompt step={attempt.step} hideHeading />
                    {attempt.step.kind === 'encounter' && <button className={`${button} flex w-full items-center justify-center gap-2 bg-ember text-obsidian hover:bg-ember-soft`} disabled={busy} onClick={() => respond('continue')}>Continue <ArrowRight className="size-4" /></button>}
                    {attempt.step.kind === 'choice' && <div className="grid gap-3">{attempt.step.options?.map(option => <button key={option.id} className={`${button} text-left`} disabled={busy} onClick={() => respond(option.id)}>{option.label}</button>)}</div>}
                    {attempt.step.kind === 'response' && <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (answer.trim()) respond(answer.trim()) }}>
                        <label className="block space-y-2"><span className="text-sm font-medium">What would you say?</span><input className="min-h-12 w-full rounded-control border border-line-strong bg-obsidian/65 px-4" placeholder="Type your Spanish response…" value={answer} maxLength={300} onChange={event => setAnswer(event.target.value)} autoComplete="off" disabled={busy} /></label>
                        <button className={`${button} flex w-full items-center justify-center gap-2 bg-ember text-obsidian hover:bg-ember-soft`} disabled={busy || !answer.trim() || mic.state !== 'idle'} type="submit">Send response <ArrowRight className="size-4" /></button>
                        <label className="flex items-start gap-3 text-xs text-cream/70"><input type="checkbox" checked={consent} disabled={mic.state !== 'idle'} onChange={event => setConsent(event.target.checked)} />I consent to sending this recording to the transcription provider. Temporary server audio is deleted; my text response is saved with this attempt. Typing is always available.</label>
                        <button className={`${button} inline-flex items-center gap-2`} type="button" disabled={!consent || busy || mic.state === 'processing'} onClick={() => mic.state === 'recording' ? mic.stop() : mic.start()}><Mic className="size-4" />{mic.state === 'recording' ? 'Stop recording' : mic.state === 'processing' ? 'Transcribing…' : 'Record instead (up to 60 seconds)'}</button>
                        {mic.recordingUrl && <audio controls src={mic.recordingUrl} aria-label="Play back your recording" className="max-w-full" />}
                        {mic.error && <p role="status" className="text-sm text-amber-200">Voice is unavailable. You can type your response or retry the microphone.</p>}
                        <p className="text-xs text-cream/60">Check the recognized text before sending. Transcription is not a pronunciation assessment.</p>
                    </form>}
                    {attempt.step.kind !== 'encounter' && <button className={`${button} inline-flex items-center gap-2`} disabled={busy} onClick={() => run(async () => setAttempt(await request<GoldenAttempt>(`/api/v1/attempts/${attempt.id}/support`, { sequence: attempt.sequence })))}><Lightbulb className="size-4 text-ember-soft" />Show support (records assisted performance)</button>}
                    {attempt.support && <p className="rounded-xl border border-amber-200/30 p-4" lang="es">{attempt.support}</p>}
                </div> : <div className="py-5 text-center"><p className="font-display text-3xl">Your responses are saved.</p><p className="mt-3 text-stone">Complete the attempt to calculate its evidence once.</p><button className={`${button} mt-6 bg-ember px-6 text-obsidian hover:bg-ember-soft`} disabled={busy} onClick={complete}>Complete attempt</button></div>}</div>
            </section>}
            {feedback && <p role="status" aria-live="polite" className="text-sm text-cream/70">{feedback}</p>}
            {attempt?.result && <><GoldenResultPanel result={attempt.result} /><button className={button} disabled={busy || mic.state !== 'idle'} onClick={() => run(load)}>Choose next scene</button></>}
            {busy && <p role="status">Saving…</p>}
        </div>
    </main>
}
