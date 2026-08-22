'use client'

/**
 * SceneLog — the living transcript of the scene.
 * Renders narrator lines, NPC/learner bubbles and coach refinements,
 * auto-scrolling gently as the conversation grows.
 */
import { useEffect, useRef } from 'react'
import CharacterBubble from './CharacterBubble'
import CoachLine from './CoachLine'
import NarratorLine from './NarratorLine'
import type { SceneLine } from '@/hooks/useSceneEngine'

export default function SceneLog({ lines, onListen }: {
    lines: SceneLine[]
    onListen: (text: string) => void
}) {
    const endRef = useRef<HTMLDivElement>(null)

    // Gentle follow-along scroll (smooth, never jumpy).
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [lines.length])

    return (
        <div className="px-4 sm:px-6 py-5 space-y-3 min-h-[320px] max-h-[480px] overflow-y-auto">
            {lines.map(line => {
                if (line.who === 'narrator') return <NarratorLine key={line.id} text={line.text} />
                if (line.who === 'coach') return <CoachLine key={line.id} text={line.text} />
                return (
                    <div key={line.id}>
                        <CharacterBubble character={line.who} text={line.text} mine={line.mine} />
                        {line.tap && (
                            <p className="text-[10px] text-cream/35 mt-1 ml-10">
                                <button onClick={() => onListen(line.tap!)} className="text-glow font-bold hover:underline">
                                    ▶ tap to listen
                                </button>
                            </p>
                        )}
                    </div>
                )
            })}
            <div ref={endRef} />
        </div>
    )
}