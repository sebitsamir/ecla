'use client'

import { useId } from 'react'

/* ============ Shared firefly artwork (realistic, like the mascot) ============ */
function FireflyArt({ p }: { p: string }) {
    return (
        <>
            <defs>
                <radialGradient id={`${p}g`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.95" />
                    <stop offset="35%" stopColor="#FFC857" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FFC857" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${p}a`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF6CF" />
                    <stop offset="45%" stopColor="#FFD876" />
                    <stop offset="100%" stopColor="#F09D2E" />
                </linearGradient>
                <linearGradient id={`${p}e`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A98544" />
                    <stop offset="100%" stopColor="#5C4522" />
                </linearGradient>
            </defs>

            {/* halo */}
            <circle cx="0" cy="26" r="52" fill={`url(#${p}g)`} />

            {/* antennae */}
            <path d="M -4 -44 C -10 -56, -20 -60, -26 -58" stroke="#8A6A35" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 4 -44 C 10 -56, 20 -60, 26 -58" stroke="#8A6A35" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* legs */}
            <g stroke="#6B4D2A" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9">
                <path d="M -12 -2 C -24 2, -30 10, -32 18" />
                <path d="M 12 -2 C 24 2, 30 10, 32 18" />
                <path d="M -10 12 C -20 20, -24 28, -24 36" />
                <path d="M 10 12 C 20 20, 24 28, 24 36" />
            </g>

            {/* open elytra (wing covers) */}
            <path d="M -4 -12 C -30 -20, -48 -4, -44 22 C -26 20, -10 8, -3 -2 Z" fill={`url(#${p}e)`} />
            <path d="M 4 -12 C 30 -20, 48 -4, 44 22 C 26 20, 10 8, 3 -2 Z" fill={`url(#${p}e)`} />
            <path d="M -10 -10 C -26 -12, -36 -4, -38 10" stroke="#C9A35C" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M 10 -10 C 26 -12, 36 -4, 38 10" stroke="#C9A35C" strokeWidth="2" fill="none" opacity="0.6" />

            {/* pronotum */}
            <ellipse cx="0" cy="-14" rx="14" ry="11" fill="#D9B36A" />
            <path d="M -10 -20 Q 0 -26 10 -20" stroke="#F2DCA2" strokeWidth="2.5" fill="none" opacity="0.8" />

            {/* head */}
            <circle cx="0" cy="-32" r="8.5" fill="#5C4522" />
            <circle cx="-3.4" cy="-34" r="2.6" fill="#2A1C10" />
            <circle cx="3.4" cy="-34" r="2.6" fill="#2A1C10" />
            <circle cx="-2.6" cy="-35" r="0.9" fill="#fff" opacity="0.8" />
            <circle cx="4.2" cy="-35" r="0.9" fill="#fff" opacity="0.8" />

            {/* glowing segmented abdomen */}
            <path d="M 0 -2 C 13 6, 15 30, 0 48 C -15 30, -13 6, 0 -2 Z" fill={`url(#${p}a)`} />
            <path d="M -10 12 Q 0 17 10 12" stroke="#C97C2B" strokeWidth="2" fill="none" opacity="0.55" />
            <path d="M -9 22 Q 0 27 9 22" stroke="#C97C2B" strokeWidth="2" fill="none" opacity="0.55" />
            <path d="M -7 32 Q 0 36 7 32" stroke="#C97C2B" strokeWidth="2" fill="none" opacity="0.55" />
            <ellipse cx="0" cy="26" rx="6" ry="9" fill="#FFF6CF" opacity="0.9" />
        </>
    )
}

/* ============ Standalone realistic firefly ============ */
export function RealFirefly({ size = 48, className = '' }: { size?: number; className?: string }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
    return (
        <svg width={size} height={size * 1.16} viewBox="-60 -70 120 140" className={className} aria-hidden="true">
            <FireflyArt p={uid} />
        </svg>
    )
}

/* ============ PRIMARY LOGO — wordmark with firefly perched on the "l" ============ */
export function Logo({ className = 'text-3xl', fireflySize = 40 }: { className?: string; fireflySize?: number }) {
    return (
        <span className={`relative inline-flex font-display font-semibold tracking-tight text-cream ${className}`}>
            <span>Ec</span>
            <span className="relative inline-block">
                <span
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                    style={{ bottom: '58%' }}
                >
                    <RealFirefly size={fireflySize} />
                </span>
                l
            </span>
            <span>a</span>
        </span>
    )
}

/* ============ APP ICON — crescent moon cradling the firefly ============ */
export function LogoMark({ size = 48 }: { size?: number }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
    return (
        <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
            <defs>
                <radialGradient id={`${uid}bg`} cx="50%" cy="40%" r="80%">
                    <stop offset="0%" stopColor="#13294B" />
                    <stop offset="55%" stopColor="#0B1C38" />
                    <stop offset="100%" stopColor="#071224" />
                </radialGradient>
                <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFDF4" />
                    <stop offset="60%" stopColor="#F1EBD8" />
                    <stop offset="100%" stopColor="#CFC5A9" />
                </linearGradient>
                <mask id={`${uid}cut`}>
                    <rect width="512" height="512" fill="black" />
                    <circle cx="238" cy="268" r="152" fill="white" />
                    <circle cx="305" cy="225" r="138" fill="black" />
                </mask>
            </defs>

            <rect width="512" height="512" rx="115" fill={`url(#${uid}bg)`} />

            {/* stars */}
            <circle cx="96" cy="120" r="4" fill="#F4F1EA" opacity="0.5" />
            <circle cx="420" cy="96" r="3" fill="#F4F1EA" opacity="0.4" />
            <circle cx="430" cy="330" r="3.5" fill="#F4F1EA" opacity="0.35" />
            <circle cx="120" cy="410" r="3" fill="#F4F1EA" opacity="0.3" />

            {/* painterly crescent */}
            <rect width="512" height="512" fill={`url(#${uid}m)`} mask={`url(#${uid}cut)`} />

            {/* the firefly, cradled in the moon */}
            <g transform="translate(300 238) rotate(-28) scale(1.5)">
                <FireflyArt p={uid} />
            </g>
        </svg>
    )
}