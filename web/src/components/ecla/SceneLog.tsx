'use client'

/**
 * SceneLog — the living transcript of the scene.
 * Phase S3.7: scrollbar hidden; height adapts to viewport on phones so the
 * interaction dock stays visible without long inner scrolling.
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

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [lines.length])

    return (
        <div className="scrollbar-hide px-4 sm:px-6 py-5 space-y-3 min-h-[280px] max-h-[45vh] sm:min-h-[320px] sm:max-h-[480px] overflow-y-auto">
            {lines.map(line => (
                <div key={line.id} className="animate-fade-up">
                    {line.who === 'narrator' && <NarratorLine text={line.text} />}
                    {line.who === 'coach' && <CoachLine text={line.text} />}
                    {line.who !== 'narrator' && line.who !== 'coach' && (
                        <CharacterBubble
                            character={line.who}
                            text={line.text}
                            mine={line.mine}
                            gloss={line.gloss}
                            onListen={onListen}
                        />
                    )}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    )
}