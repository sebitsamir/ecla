'use client'

import Firefly from '@/components/Firefly'

export default function EclaLoader({ label = 'Waking Ecla…' }: { label?: string }) {
    return (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-night-950 font-body">
            <Firefly mood="thinking" size={140} />
            <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-glow animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cream/50">{label}</p>
            </div>
        </div>
    )
}