'use client'

/**
 * SpeakerButton — TTS trigger with lifecycle callbacks.
 * Fires onStart the instant audio begins (unlocks the lesson flow)
 * and onEnd when it finishes (accurate "listened" evidence).
 * Shows a gentle pulse while playing (calm, per design rules).
 */

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak, cancelSpeech } from '@/lib/speech'

type Props = {
    text: string
    lang?: string
    size?: 'sm' | 'md' | 'lg'
    onStart?: () => void
    onEnd?: () => void
}

export default function SpeakerButton({ text, lang = 'es-ES', size = 'md', onStart, onEnd }: Props) {
    const [playing, setPlaying] = useState(false)

    const box = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-16 w-16' : 'h-10 w-10'
    const icon = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'

    const play = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!text) return
        cancelSpeech()
        setPlaying(true)
        onStart?.()                       // ← unlock immediately, even if onEnd is late
        speak(text, lang, {
            onEnd: () => {
                setPlaying(false)
                onEnd?.()
            },
        })
        // safety net: if the engine never fires onEnd, don't stay "playing" forever
        setTimeout(() => setPlaying(false), Math.max(1500, text.length * 120))
    }

    return (
        <button
            onClick={play}
            aria-label={`Listen: ${text}`}
            className={`flex ${box} flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                playing
                    ? 'border-violet-500/60 bg-violet-600/20 text-violet-300 animate-pulse'
                    : 'border-white/10 bg-white/5 text-cream/70 hover:bg-white/10 hover:text-cream'
            }`}
        >
            <Volume2 className={icon} />
        </button>
    )
}