'use client'
import type { SceneStep } from '../../../../packages/contracts/scene'
import { Volume2, Square } from 'lucide-react'
import { useSpeech } from '@/lib/useSpeech'
import { speakerIdentity } from '@/lib/scenePresentation'

export function ScenePrompt({ step, hideHeading = false }: { step: SceneStep; hideHeading?: boolean }) {
    const { speak, stop, speaking, supported } = useSpeech(step.audio.locale)
    const person = speakerIdentity(step.speaker)
    return <div className="space-y-4">
        {!hideHeading && <div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-ember-soft">{step.stage}</p><h2 className="font-display mt-2 text-2xl leading-tight text-ivory sm:text-3xl">{step.prompt}</h2></div>}
        {step.line && <div className="rounded-[1.35rem] border border-line-strong bg-ivory p-5 text-obsidian shadow-[0_18px_60px_rgba(0,0,0,.25)] sm:p-6">
            {step.speaker && <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-obsidian/55">{person.name}</p>}
            <div className="flex items-start justify-between gap-4"><div><p lang="es" className="font-display text-2xl leading-snug sm:text-3xl">“{step.line}”</p>{step.translation && <p className="mt-2 text-sm text-obsidian/60">{step.translation}</p>}</div>
            <button type="button" disabled={!supported} aria-label={speaking ? 'Stop spoken model' : 'Play spoken model'} className="ecla-control flex size-11 shrink-0 items-center justify-center rounded-full border border-obsidian/15 bg-obsidian text-ivory disabled:opacity-35" onClick={() => speaking ? stop() : speak(step.line!, { lang: step.audio.locale, rate: step.audio.rate })}>{speaking ? <Square className="size-4" /> : <Volume2 className="size-4" />}</button></div>
            <p className="mt-4 text-[10px] uppercase tracking-[.12em] text-obsidian/40">Browser voice · {step.audio.locale} · {step.audio.rate}× pace</p>
        </div>}
    </div>
}
