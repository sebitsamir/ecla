'use client'

/**
 * SceneBackdrop — The cinematic environment.
 * Replaces flat gradients with moody, high-quality photography.
 * Heavy dark overlays ensure text remains readable while the world feels alive.
 */
import type { Environment } from '@/lib/sceneTypes'

/** Curated, high-quality environments. Dark overlays applied in the UI. */
const IMAGES: Record<Environment, string> = {
    cafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80',
    street: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80',
    shop: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1600&q=80',
    home: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
}

export default function SceneBackdrop({ environment, setting, title }: {
    environment: Environment
    setting: string
    title?: string
}) {
    return (
        <div className="relative h-48 w-full overflow-hidden border-b border-white/5">
            {/* The Environmental Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                style={{ backgroundImage: `url(${IMAGES[environment]})` }}
            />
            
            {/* Heavy Dark Overlay for readability & cinematic mood */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/80 to-[#0B0B10]/40" />
            
            {/* Subtle Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

            {/* Typography */}
            <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-5 sm:px-8 sm:pb-6">
                <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-cream/50 font-medium">
                    {setting}
                </p>
                {title && (
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-cream tracking-tight drop-shadow-lg">
                        {title}
                    </h2>
                )}
            </div>
        </div>
    )
}