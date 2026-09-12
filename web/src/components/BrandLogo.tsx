import Image from 'next/image'
import type { CSSProperties } from 'react'

type Tone = 'dark' | 'light'

/** Exact flat artwork extracted from the approved ECLA identity sheet. */
export function Logo({ className = '', height = 34, style, tone = 'dark' }: {
    className?: string
    height?: number
    style?: CSSProperties
    tone?: Tone
}) {
    return (
        <Image
            src={tone === 'dark' ? '/brand/ecla-lockup-dark.png?v=2' : '/brand/ecla-lockup-light.png?v=2'}
            alt=""
            width={796}
            height={256}
            loading="eager"
            unoptimized
            className={className}
            style={{ width: 'auto', height: Math.max(28, height), ...style }}
        />
    )
}

export function LogoMark({ size = 48, className = '', style, tone = 'dark' }: {
    size?: number
    className?: string
    style?: CSSProperties
    tone?: Tone
}) {
    return (
        <Image
            src={tone === 'dark' ? '/brand/ecla-mark-dark.png?v=2' : '/brand/ecla-mark-light.png?v=2'}
            alt=""
            width={218}
            height={256}
            unoptimized
            className={className}
            style={{ width: 'auto', height: size, ...style }}
        />
    )
}
