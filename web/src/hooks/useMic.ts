'use client'

import { API_URL } from '@/lib/apiClient'

/**
 * useMic — record → Whisper transcript, with honest failure states.
 * 'denied'  → permission blocked; caller should offer the typing fallback.
 * 'network' → transcription failed; caller may retry or fall back.
 * Tracks are always released (privacy + device hygiene).
 */
import { useCallback, useEffect, useRef, useState } from 'react'


export type MicState = 'idle' | 'recording' | 'processing'
export type MicError = 'denied' | 'network' | null

export function useMic(
    getToken: () => Promise<string | null>,
    onText: (text: string) => void,
) {
    const [state, setState] = useState<MicState>('idle')
    const [error, setError] = useState<MicError>(null)
    const recRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // Release the microphone if the component unmounts mid-recording.
    useEffect(() => () => {
        recRef.current?.state === 'recording' && recRef.current.stop()
        streamRef.current?.getTracks().forEach(t => t.stop())
    }, [])

    const stop = useCallback(() => {
        const rec = recRef.current
        if (rec && rec.state === 'recording') rec.stop()
    }, [])

    const start = useCallback(async () => {
        setError(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const rec = new MediaRecorder(stream)
            recRef.current = rec
            chunksRef.current = []

            rec.ondataavailable = e => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            rec.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                setState('processing')
                try {
                    const token = await getToken()
                    const res = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'audio/webm' },
                        body: new Blob(chunksRef.current, { type: 'audio/webm' }),
                    })
                    const text = ((await res.json()).text ?? '').trim()
                    setState('idle')
                    if (text) onText(text)
                } catch {
                    setState('idle')
                    setError('network')
                }
            }

            rec.start()
            setState('recording')
        } catch {
            // getUserMedia rejected (permission / no device).
            setState('idle')
            setError('denied')
        }
    }, [getToken, onText])

    return { state, error, start, stop }
}