'use client'

import Firefly from '@/components/Firefly'

export default function PageLoader({ size = 100 }: { size?: number }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night-950/95">
            <Firefly mood="thinking" size={size} />
        </div>
    )
}