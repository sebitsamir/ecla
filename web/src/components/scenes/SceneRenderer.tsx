'use client'
import { useEffect, useState } from 'react'
import type { SceneDelivery } from '../../../../packages/contracts/scene'
import { ScenePrompt } from './ScenePrompt'

/** Renders only the server document; no local curriculum compilation or mastery writes. */
export function SceneRenderer({ delivery, preview = false, onExit }: { delivery: SceneDelivery; preview?: boolean; onExit: () => void }) {
    const [sequence, setSequence] = useState(0)
    const [answer, setAnswer] = useState('')
    const step = delivery.document.steps[sequence]
    useEffect(() => () => { window.speechSynthesis?.cancel() }, [])
    const next = () => { window.speechSynthesis?.cancel(); setSequence(value => value + 1); setAnswer('') }
    return <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-white/10 p-6 text-cream">
        <p role="status">{preview ? 'Author preview' : 'Practice only'} · No XP, score or mastery is awarded.</p>
        <h1 className="text-3xl font-bold">{delivery.document.title}</h1>
        <p>{delivery.document.setting}</p><p className="text-sm text-cream/60">{delivery.document.objective}</p>
        <progress aria-label="Scene progress" className="w-full" max={delivery.document.steps.length} value={sequence} />
        {step ? <div key={step.id} className="space-y-4">
            <ScenePrompt step={step} />
            {step.kind === 'encounter' && <button className="rounded-xl border px-4 py-3" onClick={next}>Continue</button>}
            {step.kind === 'choice' && <div className="grid gap-3">{step.options?.map(option => <button className="rounded-xl border border-white/20 p-3 text-left" key={option.id} onClick={next}>{option.label}</button>)}</div>}
            {step.kind === 'response' && <form className="space-y-3" onSubmit={event => { event.preventDefault(); if (answer.trim()) next() }}>
                <label className="block">Practice response<input className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 p-3" value={answer} maxLength={300} onChange={event => setAnswer(event.target.value)} /></label>
                <p className="text-sm text-cream/60">Your response is not evaluated or saved in this practice player.</p>
                <button className="rounded-xl border px-4 py-3 disabled:opacity-40" disabled={!answer.trim()}>Continue practice</button>
            </form>}
        </div> : <p role="status">Practice viewed. This does not establish independent performance or retained mastery.</p>}
        <p className="break-all text-xs text-cream/50">Version {delivery.version} · {delivery.document.compilerVersion}</p>
        <button className="rounded-xl border border-white/20 px-4 py-3" onClick={onExit}>{preview ? 'Close preview' : 'Back to scenes'}</button>
    </section>
}
