'use client'

import { LogoMark } from '@/components/BrandLogo'

export default function PageLoader({ size = 100 }: { size?: number }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night-950/95">
            <LogoMark size={size} className="animate-pulse" />
        </div>
    )
}
