'use client'

import { useEffect } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { useVoice } from '@/lib/useVoice'
import { cancelSpeech } from '@/lib/speech'

export type MicStatus = 'idle' | 'listening' | 'processing'

interface MicButtonProps {
    onTranscript: (text: string) => void
    onStatus?: (status: MicStatus) => void
    disabled?: boolean
}

export default function MicButton({ onTranscript, onStatus, disabled }: MicButtonProps) {
    const { listening, processing, start, stop } = useVoice(onTranscript)

    useEffect(() => {
        onStatus?.(listening ? 'listening' : processing ? 'processing' : 'idle')
    }, [listening, processing, onStatus])

    const handleClick = async () => {
        if (listening) { stop(); return }
        cancelSpeech() // never record over Ecla's voice
        try {
            await start()
        } catch (e) {
            console.error(e)
            alert('Microphone access denied. Check your browser permissions.')
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={disabled || processing}
            title={listening ? 'Stop recording' : 'Speak to Ecla'}
            className={`rounded-xl px-3.5 py-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                listening
                    ? 'bg-coral text-night-900 animate-pulse'
                    : 'border border-white/10 bg-night-800/70 text-cream/70 hover:text-cream hover:border-white/25'
            }`}
        >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        </button>
    )
}