'use client'
import type { SceneStep } from '../../../../packages/contracts/scene'
import { Volume2, Square } from 'lucide-react'
import { useSpeech } from '@/lib/useSpeech'

export function ScenePrompt({ step, hideHeading = false }: { step: SceneStep; hideHeading?: boolean }) {
    const { speak, stop, speaking, supported } = useSpeech(step.audio.locale)
    return <div className="space-y-3">
        {!hideHeading && <><p className="text-xs uppercase text-cream/60">{step.stage}</p>
        <h2 className="text-xl font-semibold">{step.prompt}</h2></>}
        {step.line && <div className="space-y-2 rounded-xl bg-white/5 p-4">
            {step.speaker && <p className="text-sm text-cream/60">{step.speaker}</p>}
            <p lang="es" className="text-xl">{step.line}</p>
            {step.translation && <p>{step.translation}</p>}
            <button type="button" disabled={!supported} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 disabled:opacity-40" onClick={() => speaking ? stop() : speak(step.line!, { lang: step.audio.locale, rate: step.audio.rate })}>{speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{speaking ? 'Stop model' : 'Play model'}</button>
            <p className="text-[11px] text-cream/45">Browser voice fallback · {step.audio.locale} · {step.audio.rate}× authored pace</p>
        </div>}
    </div>
}
