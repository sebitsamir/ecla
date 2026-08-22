'use client'

/**
 * CharacterBubble — one utterance in the scene.
 * NPC bubbles carry an avatar + tap-to-replay TTS; the learner's own
 * bubbles (`mine`) are right-aligned and violet. No "Correct!" energy —
 * bubbles are conversation, not verdicts.
 */
import { Volume2 } from 'lucide-react'
import { CAST } from '@/content/cast'
import { useTTS } from '@/hooks/useTTS'
import type { CharacterId } from '@/lib/sceneTypes'

export default function CharacterBubble({ character, text, mine = false }: {
    character: CharacterId
    text: string
    mine?: boolean
}) {
    const { say } = useTTS()
    const meta = CAST[character]

    return (
        <div className={`flex items-end gap-2.5 ${mine ? 'justify-end' : 'justify-start'}`}>
            {!mine && (
                <span className={`h-8 w-8 rounded-full border flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${meta.color}`}>
                    {meta.name[0]}
                </span>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-violet-600 text-white' : 'bg-white/5 border border-white/10 text-cream/90'}`}>
                {text}
                {!mine && (
                    <button
                        onClick={() => say(text)}
                        aria-label={`Hear again: ${text}`}
                        className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-glow align-middle"
                    >
                        <Volume2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}