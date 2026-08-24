'use client'

/**
 * CharacterPresence — the character lives in the space (Phase S3.4 + S3.7).
 * Phase S3.7: on phones the portrait sits top-corner (smaller) so it never
 * covers the title; name tag hidden below sm.
 */
import { CAST } from '@/content/cast'
import type { CharacterId, Environment } from '@/lib/sceneTypes'

const PORTRAITS: Record<string, string> = {
    sofia: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    marta: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80',
    daniel: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    luis: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    ana: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
}

/** Mobile = top corner; desktop = bottom anchor per environment. */
const POSITION: Record<Environment, string> = {
    cafe:   'right-3 top-3 sm:right-8 sm:top-auto sm:bottom-3',
    street: 'left-3 top-3 sm:left-8 sm:top-auto sm:bottom-3',
    shop:   'right-3 top-3 sm:right-8 sm:top-auto sm:bottom-3',
    home:   'left-3 top-3 sm:left-8 sm:top-auto sm:bottom-3',
    hotel:  'right-3 top-3 sm:right-8 sm:top-auto sm:bottom-3',
    office: 'left-3 top-3 sm:left-8 sm:top-auto sm:bottom-3',
}

export default function CharacterPresence({ character, environment, feedback, speaking }: {
    character: CharacterId
    environment: Environment
    feedback?: 'correct' | 'incorrect' | null
    speaking?: boolean
}) {
    const src = PORTRAITS[character]
    if (!src || character === 'you') return null
    const meta = CAST[character]

    const reaction =
        feedback === 'correct'
            ? 'scale-105 brightness-110 ring-2 ring-leaf/70'
            : feedback === 'incorrect'
                ? 'scale-[0.98] grayscale-[35%] brightness-90 -rotate-1'
                : 'ring-1 ring-white/10'

    return (
        <div className={`absolute z-10 ${POSITION[environment]} pointer-events-none select-none`} aria-hidden>
            <div className="relative">
                {speaking && (
                    <span className="absolute inset-0 rounded-full bg-glow/20 blur-md animate-pulse" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt=""
                    className={`h-14 w-14 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-white/15 shadow-2xl transition-all duration-500 ${reaction}`}
                />
                <span className="absolute -bottom-2 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0B0B10]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream/70 backdrop-blur sm:block">
                    {meta?.name ?? character}
                </span>
            </div>
        </div>
    )
}