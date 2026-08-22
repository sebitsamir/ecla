'use client'

/**
 * useTTS — single owner of speech playback for the Scene Engine.
 * Components never call the speech lib directly; this hook guarantees
 * one utterance at a time and cleans up on unmount (no ghost audio).
 */
import { useCallback, useEffect } from 'react'
import { speak, cancelSpeech } from '@/lib/speech'

export function useTTS() {
    // Never leave audio playing after the scene unmounts.
    useEffect(() => () => cancelSpeech(), [])

    /** Speak Spanish text; optional onEnd fires when playback finishes. */
    const say = useCallback((text: string, onEnd?: () => void) => {
        if (!text) {
            onEnd?.()
            return
        }
        cancelSpeech()
        speak(text, 'es-ES', {
            onEnd: () => onEnd?.(),
        })
    }, [])

    const stop = useCallback(() => cancelSpeech(), [])

    return { say, stop }
}