'use client'

/**
 * SceneBackdrop — cinematic environment + living presence (Phase S3.4 + S3.7).
 * Phase S3.7: typography scales down on phones; title reserves right padding
 * so it never collides with the top-corner portrait.
 */
import type { CharacterId, Environment } from '@/lib/sceneTypes'
import AmbientLayer from './AmbientLayer'
import CharacterPresence from './CharacterPresence'

const IMAGES: Record<Environment, string> = {
    cafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80',
    street: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80',
    shop: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1600&q=80',
    home: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
}

export default function SceneBackdrop({ environment, setting, title, timeOfDay = 'morning', mood = 'calm', character, feedback, speaking }: {
    environment: Environment
    setting: string
    title?: string
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
    mood?: 'warm' | 'calm' | 'busy' | 'quiet'
    character?: CharacterId
    feedback?: 'correct' | 'incorrect' | null
    speaking?: boolean
}) {
    const isEvening = timeOfDay === 'evening' || timeOfDay === 'night'
    const isBusy = mood === 'busy'

    return (
        <div className="relative h-48 sm:h-56 w-full overflow-hidden border-b border-white/5">
            {/* Layer 1 — the world, breathing slowly */}
            <div
                className={`absolute inset-0 bg-cover bg-center animate-breathe ${isEvening ? 'brightness-50 saturate-125' : 'brightness-90'}`}
                style={{ backgroundImage: `url(${IMAGES[environment]})` }}
            />

            {/* Layer 2 — ambient life */}
            <AmbientLayer environment={environment} timeOfDay={timeOfDay} />

            {/* Layer 3 — readability overlay */}
            <div className={`absolute inset-0 ${
                isEvening
                    ? 'bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/90 to-[#1A1025]/60'
                    : isBusy
                        ? 'bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/85 to-[#0B0B10]/50'
                        : 'bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/70 to-[#0B0B10]/30'
            }`} />

            {/* Layer 4 — the person in the space */}
            {character && (
                <CharacterPresence
                    character={character}
                    environment={environment}
                    feedback={feedback}
                    speaking={speaking}
                />
            )}

            {/* Layer 5 — vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

            {/* Layer 6 — typography (responsive) */}
            <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-4 sm:px-8 sm:pb-6">
                <p className={`mb-1 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-medium ${isEvening ? 'text-glow/80' : 'text-cream/50'}`}>
                    {setting}
                </p>
                {title && (
                    <h2 className="font-display text-xl sm:text-3xl font-bold text-cream tracking-tight drop-shadow-lg pr-16 sm:pr-0">
                        {title}
                    </h2>
                )}
            </div>
        </div>
    )
}