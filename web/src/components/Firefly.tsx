'use client'

import { useId } from 'react'
import { DEFAULT_GLOW, GlowPalette } from '@/lib/cosmetics'

export type FireflyMood = 'idle' | 'excited' | 'dim' | 'sad' | 'proud' | 'radiant' | 'thinking'

const DARK = '#3A2417'
const BLUSH = '#FF9A8A'
const LIMB = '#7A4A2B'
const ARM = '#8A5A3B'
const HAND = '#B98046'
const OUTLINE = '#B97B33'

function Face({ mood }: { mood: FireflyMood }) {
    switch (mood) {
        case 'excited':
            return (
                <g>
                    <path d="M105 77 Q111 72 117 77" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M123 77 Q129 72 135 77" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <circle cx="111" cy="86" r="5.4" fill={DARK} />
                    <circle cx="129" cy="86" r="5.4" fill={DARK} />
                    <circle cx="113" cy="84" r="2" fill="#fff" />
                    <circle cx="131" cy="84" r="2" fill="#fff" />
                    <circle cx="109.5" cy="88.5" r="1" fill="#fff" opacity="0.8" />
                    <circle cx="127.5" cy="88.5" r="1" fill="#fff" opacity="0.8" />
                    <path d="M110 95 q10 13 20 0 z" fill={DARK} />
                    <path d="M115 99 q5 5 10 0 q-5 2 -10 0 z" fill={BLUSH} />
                    <ellipse cx="101" cy="93" rx="5" ry="3" fill={BLUSH} opacity="0.55" />
                    <ellipse cx="139" cy="93" rx="5" ry="3" fill={BLUSH} opacity="0.55" />
                </g>
            )
        case 'proud':
            return (
                <g>
                    <path d="M105 87 q6 -7 12 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M123 87 q6 -7 12 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M111 95 q9 8 18 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <ellipse cx="101" cy="93" rx="5" ry="3" fill={BLUSH} opacity="0.55" />
                    <ellipse cx="139" cy="93" rx="5" ry="3" fill={BLUSH} opacity="0.55" />
                </g>
            )
        case 'radiant':
            return (
                <g>
                    <path d="M105 87 q6 -6 12 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M123 87 q6 -6 12 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M112 95 q8 10 16 0 z" fill={DARK} />
                    <ellipse cx="101" cy="93" rx="5" ry="3" fill={BLUSH} opacity="0.6" />
                    <ellipse cx="139" cy="93" rx="5" ry="3" fill={BLUSH} opacity="0.6" />
                </g>
            )
        case 'dim':
            return (
                <g>
                    <path d="M106 85 q5 5 10 0 z" fill={DARK} />
                    <path d="M124 85 q5 5 10 0 z" fill={DARK} />
                    <path d="M106 85 h10" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
                    <path d="M124 85 h10" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
                    <path d="M116 98 q4 2 8 0" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <ellipse cx="102" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.2" />
                    <ellipse cx="138" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.2" />
                </g>
            )
        case 'sad':
            return (
                <g>
                    <path d="M106 81 L116 78" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M134 81 L124 78" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="111" cy="87" r="3.8" fill={DARK} />
                    <circle cx="129" cy="87" r="3.8" fill={DARK} />
                    <circle cx="112" cy="85.6" r="1.2" fill="#fff" />
                    <circle cx="130" cy="85.6" r="1.2" fill="#fff" />
                    <path d="M112 100 q8 -6 16 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <ellipse cx="102" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.15" />
                    <ellipse cx="138" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.15" />
                </g>
            )
        case 'thinking':
            return (
                <g>
                    <path d="M105 76 Q111 72 117 76" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M124 79 h10" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="111" cy="86" r="4.6" fill={DARK} />
                    <circle cx="112.6" cy="84.4" r="1.5" fill="#fff" />
                    <path d="M124 86 q5 5 10 0 z" fill={DARK} />
                    <path d="M124 86 h10" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
                    <ellipse cx="121" cy="98" rx="3" ry="3.4" fill={DARK} />
                    <ellipse cx="102" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.3" />
                    <ellipse cx="138" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.3" />
                </g>
            )
        default:
            return (
                <g>
                    <circle cx="111" cy="86" r="4.6" fill={DARK} />
                    <circle cx="129" cy="86" r="4.6" fill={DARK} />
                    <circle cx="112.6" cy="84.4" r="1.5" fill="#fff" />
                    <circle cx="130.6" cy="84.4" r="1.5" fill="#fff" />
                    <path d="M112 96 q8 7 16 0" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
                    <ellipse cx="102" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.45" />
                    <ellipse cx="138" cy="94" rx="5" ry="3" fill={BLUSH} opacity="0.45" />
                </g>
            )
    }
}

export default function Firefly({ mood = 'idle', size = 140, className = '', glow = DEFAULT_GLOW }: {
    mood?: FireflyMood
    size?: number
    className?: string
    glow?: GlowPalette
}) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
    const glowId = `g${uid}`
    const bellyId = `b${uid}`
    const wingId = `w${uid}`
    const shellId = `s${uid}`

    return (
        <div className={`ecla-firefly ecla-firefly--${mood} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
            <svg viewBox="0 0 240 240" width="100%" height="100%">
                <defs>
                    <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={glow.core} stopOpacity="0.95" />
                        <stop offset="35%" stopColor={glow.halo} stopOpacity="0.55" />
                        <stop offset="100%" stopColor={glow.halo} stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={bellyId} cx="50%" cy="42%" r="65%">
                        <stop offset="0%" stopColor={glow.core} />
                        <stop offset="45%" stopColor={glow.mid} />
                        <stop offset="100%" stopColor={glow.deep} />
                    </radialGradient>
                    <linearGradient id={wingId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8A5A3B" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#5A3A26" stopOpacity="0.28" />
                    </linearGradient>
                    <linearGradient id={shellId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFE3AE" />
                        <stop offset="100%" stopColor="#E2A85C" />
                    </linearGradient>
                </defs>

                <circle className="ff-glow" cx="120" cy="158" r="58" fill={`url(#${glowId})`} />

                <g className="ff-wing ff-wing--l">
                    <ellipse cx="86" cy="104" rx="34" ry="16" fill={`url(#${wingId})`} transform="rotate(-32 86 104)" />
                </g>
                <g className="ff-wing ff-wing--r">
                    <ellipse cx="154" cy="104" rx="34" ry="16" fill={`url(#${wingId})`} transform="rotate(32 154 104)" />
                </g>

                <g stroke={LIMB} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9">
                    <path d="M106 132 q-8 6 -12 14" />
                    <path d="M112 138 q-6 8 -8 16" />
                    <path d="M134 132 q8 6 12 14" />
                    <path d="M128 138 q6 8 8 16" />
                </g>

                <ellipse cx="120" cy="152" rx="22" ry="26" fill={`url(#${bellyId})`} />
                <path d="M101 146 q19 8 38 0" stroke={glow.deep} strokeWidth="2" fill="none" opacity="0.5" />
                <path d="M103 158 q17 8 34 0" stroke={glow.deep} strokeWidth="2" fill="none" opacity="0.5" />

                <ellipse cx="120" cy="118" rx="24" ry="20" fill={`url(#${shellId})`} stroke={OUTLINE} strokeOpacity="0.5" strokeWidth="2" />

                <g className="ff-arm ff-arm--l" stroke={ARM} strokeWidth="7" strokeLinecap="round" fill="none">
                    <path d="M102 116 Q 96 126 104 132" />
                    <circle cx="104" cy="132" r="4.5" fill={HAND} stroke="none" />
                </g>
                <g className="ff-arm ff-arm--r" stroke={ARM} strokeWidth="7" strokeLinecap="round" fill="none">
                    <path d="M138 116 Q 144 126 136 132" />
                    <circle cx="136" cy="132" r="4.5" fill={HAND} stroke="none" />
                </g>

                <circle cx="120" cy="88" r="26" fill={`url(#${shellId})`} stroke={OUTLINE} strokeOpacity="0.5" strokeWidth="2" />

                <g stroke={LIMB} strokeWidth="3.5" strokeLinecap="round" fill="none">
                    <path d="M108 66 q-10 -14 -20 -18" />
                    <path d="M132 66 q10 -14 20 -18" />
                </g>
                <circle cx="87" cy="47" r="4" fill={LIMB} />
                <circle cx="153" cy="47" r="4" fill={LIMB} />

                <Face mood={mood} />

                <g className="ff-sparkles">
                    <path d="M78 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill={glow.core} />
                    <path d="M164 52 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 z" fill={glow.core} />
                </g>

                <g className="ff-motes">
                    <circle cx="120" cy="34" r="4" fill={glow.core} />
                    <circle cx="150" cy="52" r="3" fill={glow.halo} />
                    <circle cx="90" cy="52" r="3" fill={glow.halo} />
                </g>
            </svg>
        </div>
    )
}