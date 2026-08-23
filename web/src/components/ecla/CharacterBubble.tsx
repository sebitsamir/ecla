'use client'

/**
 * CharacterBubble — Cinematic character interactions.
 * Replaces colored initials with real, high-quality portraits.
 */
import { Volume2 } from 'lucide-react'
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

export default function CharacterBubble({ character, text, mine = false }: {
    character: CharacterId
    text: string
    mine?: boolean
}) {
    const { say } = useTTS()
    const meta = CAST[character]
    const avatar = AVATARS[character]

    return (
        <div className={`flex items-end gap-3 ${mine ? 'justify-end' : 'justify-start'} animate-fade-up`}>
            {!mine && avatar && (
                <div className="relative flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={avatar} 
                        alt={meta.name} 
                        className="h-10 w-10 rounded-full object-cover border-2 border-white/10 shadow-lg"
                    />
                    {/* Subtle status ring indicating they are "live" */}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-leaf border-2 border-[#0B0B10]" />
                </div>
            )}
            
            <div className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xl ${
                mine 
                    ? 'bg-glow text-night-900 font-medium' 
                    : 'bg-white/5 border border-white/10 text-cream/90 backdrop-blur-sm'
            }`}>
                {text}
                
                {!mine && (
                    <button 
                        onClick={() => say(text)} 
                        aria-label={`Hear again: ${text}`}
                        className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B0B10] border border-white/10 text-cream/60 transition-colors hover:text-glow hover:border-glow/50"
                    >
                        <Volume2 className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    )
}