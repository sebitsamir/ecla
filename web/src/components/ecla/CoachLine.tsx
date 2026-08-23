'use client'

/**
 * CoachLine — The quiet refinement layer.
 * Separates communication success from linguistic form (Art. 16).
 */
import { Lightbulb } from 'lucide-react'

export default function CoachLine({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center py-3 animate-fade-in">
            <div className="flex items-center gap-2 rounded-full border border-glow/20 bg-glow/5 px-4 py-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-glow" />
                <p className="text-[12px] text-cream/70 font-medium">
                    {text}
                </p>
            </div>
        </div>
    )
}