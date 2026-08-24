'use client'

/**
 * AmbientLayer — environmental life without assets (Phase S3.4).
 * CSS-only ambience per environment: steam (café), light streaks (street),
 * dust motes (interiors). Always pointer-events-none, aria-hidden.
 * Subtle by design: the situation is the entertainment, not the effects.
 */
import type { Environment } from '@/lib/sceneTypes'

export default function AmbientLayer({ environment, timeOfDay }: {
    environment: Environment
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}) {
    const night = timeOfDay === 'evening' || timeOfDay === 'night'

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {environment === 'cafe' && (
                <>
                    {/* Steam wisps rising from the counter */}
                    <span className="absolute left-1/3 bottom-6 h-16 w-2 rounded-full bg-white/10 blur-[6px] animate-steam" />
                    <span className="absolute left-1/2 bottom-4 h-20 w-2 rounded-full bg-white/10 blur-[6px] animate-steam [animation-delay:1.2s]" />
                    <span className="absolute left-[60%] bottom-8 h-14 w-1.5 rounded-full bg-white/10 blur-[5px] animate-steam [animation-delay:2.1s]" />
                    {/* Warm window light */}
                    <span className={`absolute -top-10 -left-10 h-48 w-48 rounded-full blur-3xl ${night ? 'bg-glow/10' : 'bg-amber-400/10'}`} />
                </>
            )}

            {environment === 'street' && (
                <>
                    {/* Passing light streaks — traffic, headlights */}
                    <span className="absolute top-1/3 -left-1/4 h-px w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-streak" />
                    <span className="absolute top-2/3 -left-1/3 h-px w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-streak [animation-delay:3s]" />
                    {night && <span className="absolute inset-0 bg-indigo-900/20" />}
                </>
            )}

            {(environment === 'home' || environment === 'shop' || environment === 'hotel' || environment === 'office') && (
                <>
                    {/* Dust motes in the light */}
                    <span className="absolute left-1/4 top-1/3 h-1 w-1 rounded-full bg-white/20 animate-dust" />
                    <span className="absolute left-2/3 top-1/2 h-1 w-1 rounded-full bg-white/15 animate-dust [animation-delay:2s]" />
                    <span className="absolute left-1/2 top-1/4 h-0.5 w-0.5 rounded-full bg-white/20 animate-dust [animation-delay:4s]" />
                </>
            )}
        </div>
    )
}