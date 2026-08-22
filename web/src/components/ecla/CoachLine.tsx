'use client'

/**
 * CoachLine — the quiet refinement layer.
 * Separates communication success from linguistic form (Art. 16):
 * "They understood you. A more natural form is: …"
 */
import { Lightbulb } from 'lucide-react'

export default function CoachLine({ text }: { text: string }) {
    return (
        <p className="text-center text-[12px] text-cream/40 flex items-center justify-center gap-1.5">
            <Lightbulb className="h-3 w-3" /> {text}
        </p>
    )
}