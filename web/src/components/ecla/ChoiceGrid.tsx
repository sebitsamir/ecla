'use client'

/**
 * ChoiceGrid — meaning-discovery / recognition options.
 * Calm cards, no right/wrong fireworks; the scene supplies consequences.
 */
import type { SceneOption } from '@/lib/sceneTypes'

export default function ChoiceGrid({ prompt, options, onPick, disabled }: {
    prompt: string
    options: SceneOption[]
    onPick: (option: SceneOption) => void
    disabled?: boolean
}) {
    return (
        <div>
            <p className="text-sm text-cream/70 mb-3">{prompt}</p>
            <div className="grid sm:grid-cols-2 gap-2">
                {options.map(option => (
                    <button
                        key={option.label}
                        disabled={disabled}
                        onClick={() => onPick(option)}
                        className="rounded-xl border border-white/10 bg-[#1A1A24] px-4 py-3 text-left text-sm text-cream/80 hover:border-white/25 transition-colors disabled:opacity-50"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    )
}