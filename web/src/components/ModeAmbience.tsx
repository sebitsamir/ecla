'use client'

/* Per-mode ambient treatment — makes each mode feel like a different world */
export const MODE_BEHAVIOR: Record<string, string> = {
    STORY: 'ff-behavior-perch',
    DRILL: 'ff-behavior-zip',
    IMMERSION: 'ff-behavior-pulse',
    PROFESSIONAL: 'ff-behavior-still',
}

export default function ModeAmbience({ mode }: { mode: string }) {
    switch (mode) {
        case 'STORY':
            return (
                <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                    {/* Warm vignette */}
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(255,180,90,0.12) 100%)' }} />
                    {/* Faint paper-grain dots */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,180,90,0.10) 1px, transparent 1.5px)', backgroundSize: '26px 26px' }} />
                </div>
            )
        case 'DRILL':
            return (
                <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                    {/* High-contrast speed lines */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(77,216,230,0.06) 0px, rgba(77,216,230,0.06) 2px, transparent 2px, transparent 110px)' }} />
                </div>
            )
        case 'IMMERSION':
            return (
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
                    <div className="amb-orb absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-immersion/20 blur-[100px]" />
                    <div className="amb-orb-slow absolute -right-24 top-2/3 h-96 w-96 rounded-full bg-immersion/15 blur-[120px]" />
                    <div className="amb-orb absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-pro/10 blur-[110px]" />
                </div>
            )
        case 'PROFESSIONAL':
            return (
                <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                    {/* Structured grid */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(127,166,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(127,166,255,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                </div>
            )
        case 'MISSION':
            return (
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-transparent to-[#0B0B10]" />
                    <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
                </div>
            )
        default:
            return null
    }
}