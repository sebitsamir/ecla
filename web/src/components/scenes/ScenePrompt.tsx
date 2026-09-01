'use client'
import type { SceneStep } from '../../../../packages/contracts/scene'

export function ScenePrompt({ step, hideHeading = false }: { step: SceneStep; hideHeading?: boolean }) {
    const speak = () => {
        if (!step.line || !window.speechSynthesis) return
        window.speechSynthesis.cancel()
        const speech = new SpeechSynthesisUtterance(step.line)
        speech.lang = step.audio.locale; speech.rate = step.audio.rate
        window.speechSynthesis.speak(speech)
    }
    return <div className="space-y-3">
        {!hideHeading && <><p className="text-xs uppercase text-cream/60">{step.stage}</p>
        <h2 className="text-xl font-semibold">{step.prompt}</h2></>}
        {step.line && <div className="space-y-2 rounded-xl bg-white/5 p-4">
            {step.speaker && <p className="text-sm text-cream/60">{step.speaker}</p>}
            <p lang="es" className="text-xl">{step.line}</p>
            {step.translation && <p>{step.translation}</p>}
            <button type="button" className="rounded-lg border border-white/20 px-4 py-2" onClick={speak}>Play model (browser voice)</button>
        </div>}
    </div>
}
