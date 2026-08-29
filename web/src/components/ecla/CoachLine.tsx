'use client'

/**
 * CoachLine — quiet evidence whisper (Phase 10).
 * Not a mascot teacher: a minimal system note when the world already reacted.
 */
import { Check } from 'lucide-react'

export default function CoachLine({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center py-2 animate-fade-in">
            <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
                <Check className="h-3 w-3 text-leaf/80" strokeWidth={3} />
                <p className="text-[11px] text-cream/50">{text}</p>
            </div>
        </div>
    )
}
