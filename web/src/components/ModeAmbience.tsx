'use client'

/* Per-mode ambient treatment — makes each mode feel like a different world */
export default function ModeAmbience({ mode }: { mode: string }) {
    switch (mode) {
        case 'STORY':
            return (
                <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                    <div className="absolute inset-0 bg-ember/[.035]" />
                </div>
            )
        case 'DRILL':
            return (
                <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                    <div className="absolute inset-0 bg-info/[.025]" />
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
                    <div className="absolute inset-0 bg-surface/25" />
                </div>
            )
        case 'MISSION':
            return (
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute inset-0 bg-obsidian/70" />
                    <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
                </div>
            )
        default:
            return null
    }
}
