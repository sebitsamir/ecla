'use client'

/**
 * SceneBackdrop — the "world" strip: environment gradient + place/time label.
 * Pure presentation; the scene's emotional anchor (Art. 7: context first).
 */
import type { Environment } from '@/lib/sceneTypes'

const GRADIENT: Record<Environment, string> = {
    cafe: 'from-amber-950/60',
    street: 'from-sky-950/60',
    shop: 'from-emerald-950/60',
    home: 'from-orange-950/50',
    hotel: 'from-indigo-950/60',
    office: 'from-slate-900/70',
}

export default function SceneBackdrop({ environment, setting, title }: {
    environment: Environment
    setting: string
    title?: string
}) {
    return (
        <div className={`bg-gradient-to-b ${GRADIENT[environment]} to-transparent px-5 pt-5 pb-4 border-b border-white/5`}>
            <p className="text-[11px] uppercase tracking-widest text-cream/40">{setting}</p>
            {title && <p className="font-display text-lg font-bold text-cream mt-0.5">{title}</p>}
        </div>
    )
}