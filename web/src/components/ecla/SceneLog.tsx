'use client'

/**
 * SceneLog — the living transcript of the scene.
 * Renders narrator lines, NPC/learner bubbles and coach refinements,
 * auto-scrolling gently as the conversation grows.
 *
 * Phase 11.3: every line fades up gently on entry (calm, never fireworks).
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
            {lines.map(line => (
                <div key={line.id} className="animate-fade-up">
                    {line.who === 'narrator' && <NarratorLine text={line.text} />}
                    {line.who === 'coach' && <CoachLine text={line.text} />}
                    {line.who !== 'narrator' && line.who !== 'coach' && (
                        <>
                            <CharacterBubble character={line.who} text={line.text} mine={line.mine} />
                            {line.tap && (
                                <p className="ml-10 mt-1 text-[10px] text-cream/35">
                                    <button onClick={() => onListen(line.tap!)} className="font-bold text-glow hover:underline">
                                        tap to listen
                                    </button>
                                </p>
                            )}
                        </>
                    )}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    )
}