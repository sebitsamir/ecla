'use client'

/**
 * CharacterBubble — Cinematic character interactions.
 * Phase S3.2: Added audio glow and avatar dimming on errors.
 */
import { Volume2 } from 'lucide-react'
import { useState } from 'react'
import { CAST } from '@/content/cast'
import { useTTS } from '@/hooks/useTTS'
import type { CharacterId } from '@/lib/sceneTypes'

/** Curated, consistent character portraits. */
const AVATARS: Record<CharacterId, string> = {
    sofia: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    marta: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80',
    daniel: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    luis: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    ana: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    you: '',
}

export default function CharacterBubble({ character, text, mine = false, gloss, onListen, isError = false }: {
    character: CharacterId
    text: string
    mine?: boolean
    gloss?: string
    onListen?: (text: string) => void
    isError?: boolean // Phase S3.2: Dims avatar on incorrect attempts
}) {
    const { say, stop } = useTTS()
    const [playing, setPlaying] = useState(false)
    
    const meta = CAST[character]
    const avatar = AVATARS[character]
    const label = (text ?? '').trim() || '…'
    
    const handlePlay = () => {
        if (playing) {
            stop()
            setPlaying(false)
            return
        }
        setPlaying(true)
        if (onListen) onListen(label)
        else say(label)
        setTimeout(() => setPlaying(false), 2000)
    }
    
    return (
        <div className={`flex items-end gap-3 ${mine ? 'justify-end' : 'justify-start'} animate-fade-up`}>
            {!mine && avatar && (
                <div className="relative flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={avatar} 
                        alt={meta?.name ?? 'Character'} 
                        // Phase S3.2: Avatar dims and desaturates on error
                        className={`h-10 w-10 rounded-full object-cover border-2 border-white/10 shadow-lg transition-all duration-500 ${
                            isError ? 'grayscale opacity-50 border-amber-500/50' : ''
                        }`}
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-leaf border-2 border-[#0B0B10]" />
                </div>
            )}
            
            <div className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xl flex items-center gap-3 transition-all duration-300 ${
                mine 
                    ? 'bg-glow text-night-900 font-medium' 
                    : `bg-white/5 border border-white/10 text-cream/90 backdrop-blur-sm ${
                        playing ? 'shadow-[0_0_20px_rgba(255,200,0,0.15)] border-glow/30' : ''
                      }`
            }`}>
                <div className="flex-1 min-w-0">
                    <span className="block break-words">{label}</span>
                    {gloss && !mine && (
                        <span className="mt-1 block text-[10px] uppercase tracking-wider text-cream/40">
                            {gloss}
                        </span>
                    )}
                </div>
                
                {!mine && (
                    <button 
                        onClick={handlePlay}
                        aria-label={`Hear again: ${label}`}
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            playing 
                                ? 'bg-glow/20 text-glow scale-110 animate-pulse' 
                                : 'bg-white/5 text-cream/60 hover:bg-white/10 hover:text-cream active:scale-95'
                        }`}
                    >
                        <Volume2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    )
}