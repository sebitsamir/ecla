'use client'

export type MoonPhase = 'new' | 'crescent' | 'quarter' | 'gibbous' | 'full'

interface MoonProps {
    phase?: MoonPhase
    size?: 'sm' | 'md' | 'lg' | 'xl'
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    className?: string
}

export default function Moon({
    phase = 'full',
    size = 'lg',
    position = 'top-right',
    className = ''
}: MoonProps) {
    const sizes = {
        sm: { moon: 40, halo: 80 },
        md: { moon: 60, halo: 120 },
        lg: { moon: 100, halo: 200 },
        xl: { moon: 140, halo: 280 },
    }

    const positions = {
        'top-right': 'fixed -right-8 top-16',
        'top-left': 'fixed -left-8 top-16',
        'bottom-right': 'fixed -right-8 bottom-16',
        'bottom-left': 'fixed -left-8 bottom-16',
    }

    const { moon, halo } = sizes[size]
    const pos = positions[position]

    // Crater positions and sizes for texture
    const craters = [
        { cx: 35, cy: 30, r: 8 },
        { cx: 55, cy: 45, r: 6 },
        { cx: 25, cy: 55, r: 5 },
        { cx: 65, cy: 65, r: 7 },
        { cx: 45, cy: 70, r: 4 },
    ]

    return (
        <div className={`pointer-events-none ${pos} ${className}`} aria-hidden="true">
            {/* Outer halo glow */}
            <div
                className="absolute rounded-full opacity-30"
                style={{
                    width: halo,
                    height: halo,
                    background: 'radial-gradient(circle, rgba(255,249,224,0.4) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Moon body */}
            <svg
                width={moon}
                height={moon}
                viewBox="0 0 100 100"
                className="relative"
            >
                {/* Base moon gradient */}
                <defs>
                    <radialGradient id="moonGradient" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#FFF9E0" />
                        <stop offset="40%" stopColor="#FFE29A" />
                        <stop offset="100%" stopColor="#E8C574" />
                    </radialGradient>

                    {/* Crater gradient for depth */}
                    <radialGradient id="craterGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#D4A857" />
                        <stop offset="100%" stopColor="#C49B4A" />
                    </radialGradient>
                </defs>

                {/* Moon sphere */}
                <circle cx="50" cy="50" r="50" fill="url(#moonGradient)" />

                {/* Craters for texture */}
                {craters.map((crater, i) => (
                    <circle
                        key={i}
                        cx={crater.cx}
                        cy={crater.cy}
                        r={crater.r}
                        fill="url(#craterGradient)"
                        opacity="0.3"
                    />
                ))}

                {/* Phase shadow overlay */}
                {phase === 'crescent' && (
                    <circle
                        cx="60"
                        cy="50"
                        r="50"
                        fill="rgba(8,10,24,0.85)"
                    />
                )}
                {phase === 'quarter' && (
                    <rect
                        x="50"
                        y="0"
                        width="50"
                        height="100"
                        fill="rgba(8,10,24,0.85)"
                    />
                )}
                {phase === 'gibbous' && (
                    <circle
                        cx="65"
                        cy="50"
                        r="50"
                        fill="rgba(8,10,24,0.6)"
                    />
                )}
                {phase === 'new' && (
                    <circle cx="50" cy="50" r="50" fill="rgba(8,10,24,0.9)" />
                )}
            </svg>
        </div>
    )
}