'use client'

/**
 * HintLadder — support fading made visible (Art. 12).
 * Shows exactly one hint at the current level; nothing when level ≤ 0.
 * The scene raises the level on each failed attempt.
 */
import { Sparkles } from 'lucide-react'

export default function HintLadder({ hints, level }: { hints: string[]; level: number }) {
    if (!hints.length || level <= 0) return null
    const hint = hints[Math.min(level, hints.length) - 1]
    return (
        <p className="text-[12px] text-glow flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" /> {hint}
        </p>
    )
}