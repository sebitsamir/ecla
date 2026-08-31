'use client'

import { API_URL } from '@/lib/apiClient'
import { useCallback, useEffect, useRef, useState } from 'react'

export type MicState = 'idle' | 'recording' | 'processing'
export type MicError = 'denied' | 'network' | null

export function useMic(getToken: () => Promise<string | null>, onText: (text: string) => void) {
    const [state, setState] = useState<MicState>('idle')
    const [error, setError] = useState<MicError>(null)
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
    const recorder = useRef<MediaRecorder | null>(null)
    const stream = useRef<MediaStream | null>(null)
    const active = useRef(false)
    const mounted = useRef(true)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const url = useRef<string | null>(null)
    const upload = useRef<AbortController | null>(null)

    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
            if (timer.current) clearTimeout(timer.current)
            upload.current?.abort()
            if (recorder.current?.state === 'recording') recorder.current.stop()
            stream.current?.getTracks().forEach(track => track.stop())
            if (url.current) URL.revokeObjectURL(url.current)
        }
    }, [])

    const stop = useCallback(() => {
        if (recorder.current?.state === 'recording') recorder.current.stop()
    }, [])

    const start = useCallback(async () => {
        if (active.current) return
        active.current = true
        setError(null)
        try {
            const input = await navigator.mediaDevices.getUserMedia({ audio: true })
            if (!mounted.current) { input.getTracks().forEach(track => track.stop()); return }
            stream.current = input
            const rec = new MediaRecorder(input)
            recorder.current = rec
            const chunks: Blob[] = []
            rec.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
            rec.onstop = async () => {
                if (timer.current) clearTimeout(timer.current)
                input.getTracks().forEach(track => track.stop())
                if (!mounted.current) return
                const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
                if (url.current) URL.revokeObjectURL(url.current)
                url.current = URL.createObjectURL(blob)
                setRecordingUrl(url.current)
                setState('processing')
                const controller = new AbortController()
                upload.current = controller
                const timeout = setTimeout(() => controller.abort(), 30000)
                try {
                    const token = await getToken()
                    if (!mounted.current) return
                    const response = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
                        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type },
                        body: blob, signal: controller.signal,
                    })
                    if (!response.ok) throw new Error('Transcription failed')
                    const data = await response.json()
                    if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('Empty transcript')
                    if (mounted.current) onText(data.text.trim())
                } catch { if (mounted.current) setError('network') }
                finally {
                    clearTimeout(timeout)
                    active.current = false
                    if (mounted.current) setState('idle')
                }
            }
            rec.start()
            timer.current = setTimeout(stop, 60000)
            setState('recording')
        } catch {
            stream.current?.getTracks().forEach(track => track.stop())
            active.current = false
            if (mounted.current) { setState('idle'); setError('denied') }
        }
    }, [getToken, onText, stop])

    return { state, error, recordingUrl, start, stop }
}
