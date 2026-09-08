'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import type { SceneDelivery } from '../../../../packages/contracts/scene'
import { ScenePrompt } from './ScenePrompt'
import { SceneWorld } from './SceneWorld'

export function SceneRenderer({ delivery, preview = false, onExit }: { delivery: SceneDelivery; preview?: boolean; onExit: () => void }) {
    const [sequence, setSequence] = useState(0)
    const [answer, setAnswer] = useState('')
    const step = delivery.document.steps[sequence]
    const total = delivery.document.steps.length
    useEffect(() => () => { window.speechSynthesis?.cancel() }, [])
    const next = () => { window.speechSynthesis?.cancel(); setSequence(value => value + 1); setAnswer('') }
    return <section className="relative min-h-dvh overflow-hidden bg-obsidian text-ivory">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-4 p-4 sm:p-6">
            <button onClick={onExit} aria-label={preview ? 'Close preview' : 'Back to scenes'} className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md"><ArrowLeft className="size-5" /></button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-ember-soft to-ember transition-[width] duration-500" style={{ width: `${Math.min(100, ((sequence + (step ? 0 : 1)) / total) * 100)}%` }} /></div>
            <p className="min-w-10 text-right text-xs font-semibold tabular-nums">{Math.min(sequence + 1, total)} / {total}</p>
        </div>
        <SceneWorld setting={delivery.document.setting} speaker={step?.speaker} title={delivery.document.title} />
        <div className="relative z-10 mx-auto -mt-20 max-w-3xl px-4 pb-10 sm:-mt-28 sm:px-6">
            <div className="rounded-[1.75rem] border border-line bg-carbon/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-xs text-stone"><ShieldCheck className="size-4 text-success" />{preview ? 'Author preview' : 'Practice only'} · No XP, score or mastery</p><p className="text-xs text-ash">{delivery.document.objective}</p></div>
                {step ? <div key={step.id} className="animate-fade-up space-y-5"><ScenePrompt step={step} />
                    {step.kind === 'encounter' && <button className="ecla-control flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ember px-5 font-semibold text-obsidian hover:bg-ember-soft" onClick={next}>Continue <ArrowRight className="size-4" /></button>}
                    {step.kind === 'choice' && <div className="grid gap-3">{step.options?.map(option => <button className="ecla-control min-h-12 rounded-control border border-line-strong bg-surface-raised p-4 text-left hover:border-ember/60 hover:bg-ember/10" key={option.id} onClick={next}>{option.label}</button>)}</div>}
                    {step.kind === 'response' && <form className="space-y-3" onSubmit={event => { event.preventDefault(); if (answer.trim()) next() }}><label className="block"><span className="text-sm font-medium">What would you say?</span><input className="mt-2 min-h-12 w-full rounded-control border border-line-strong bg-obsidian/65 px-4 text-ivory placeholder:text-ash" placeholder="Type your Spanish response…" value={answer} maxLength={300} onChange={event => setAnswer(event.target.value)} /></label><p className="text-xs text-stone">This practice response is not evaluated or saved.</p><button className="ecla-control flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ember px-5 font-semibold text-obsidian disabled:opacity-40" disabled={!answer.trim()}>Continue practice <ArrowRight className="size-4" /></button></form>}
                </div> : <div role="status" className="animate-fade-up py-5 text-center"><p className="font-display text-3xl">Scene complete.</p><p className="mt-3 text-stone">You viewed this practice. Independent performance is established only in an assessed scene.</p><button className="ecla-control mt-6 min-h-12 rounded-control bg-ember px-6 font-semibold text-obsidian" onClick={onExit}>Choose another scene</button></div>}
            </div>
            <p className="mt-4 text-center text-[10px] uppercase tracking-[.12em] text-ash">Version {delivery.version} · {delivery.document.compilerVersion}</p>
        </div>
    </section>
}
