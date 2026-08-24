'use client'

import { Volume2, VolumeX } from 'lucide-react'

export default function AudioControls({ isMuted, onToggle }: {
    isMuted: boolean
    onToggle: () => void
}) {
    return (
        <button
            onClick={onToggle}
            aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
            className="fixed top-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#13131B]/80 text-cream/60 backdrop-blur transition-all hover:text-cream hover:border-white/20 active:scale-95 lg:right-8"
        >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
    )
}