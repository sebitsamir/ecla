'use client'

/**
 * MicButton — the voice affordance everywhere in ECLA.
 * idle → recording (pulsing coral) → processing (spinner).
 * Large tap target; label slot for contextual microcopy.
 */
import { Loader2, Mic, Square } from 'lucide-react'
import type { MicState } from '@/hooks/useMic'

export default function MicButton({ state, onTap, size = 'lg', label }: {
    state: MicState
    onTap: () => void
    size?: 'md' | 'lg'
    label?: string
}) {
    const box = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
    const icon = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'

    return (
        <div className="flex flex-col items-center gap-2.5">
            <button
                onClick={onTap}
                disabled={state === 'processing'}
                aria-label={state === 'recording' ? 'Stop recording' : 'Start speaking'}
                className={`flex ${box} items-center justify-center rounded-full transition-all ${
                    state === 'recording'
                        ? 'bg-coral text-night-900 animate-pulse'
                        : state === 'processing'
                            ? 'bg-white/10 text-cream/50'
                            : 'bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 active:scale-95'
                }`}
            >
                {state === 'recording'
                    ? <Square className={icon} />
                    : state === 'processing'
                        ? <Loader2 className={`${icon} animate-spin`} />
                        : <Mic className={icon} />}
            </button>
            {label && <p className="text-[11px] text-cream/50 min-h-[16px]">{label}</p>}
        </div>
    )
}