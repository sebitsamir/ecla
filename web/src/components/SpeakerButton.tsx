'use client'

import { Volume2, Square } from 'lucide-react'
import { useSpeech } from '@/lib/useSpeech'

export default function SpeakerButton({
    text,
    audioUrl = null,
    lang = 'es-ES',
    size = 'md',
    className = '',
}: {
    text: string
    audioUrl?: string | null
    lang?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}) {
    const { speak, stop, speaking, supported } = useSpeech(lang)
    if (!supported) return null

    const dims = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
    const icon = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); speaking ? stop() : speak(text, { audioUrl }) }}
            className={`flex ${dims} items-center justify-center rounded-full border transition-all ${
                speaking
                    ? 'border-glow/60 bg-glow/20 text-glow'
                    : 'border-white/10 bg-night-900/60 text-cream/60 hover:border-glow/40 hover:text-glow'
            } active:scale-95 ${className}`}
            title={speaking ? 'Stop' : 'Listen'}
            aria-label={speaking ? 'Stop audio' : `Listen: ${text}`}
        >
            {speaking ? <Square className={icon} /> : <Volume2 className={icon} />}
        </button>
    )
}