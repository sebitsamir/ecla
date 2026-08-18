'use client'
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function useVoice(onTranscript: (text: string) => void) {
    const { getToken } = useAuth()
    const [listening, setListening] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [speaking, setSpeaking] = useState(false)
    const recRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const start = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const rec = new MediaRecorder(stream)
        chunksRef.current = []
        rec.ondataavailable = e => chunksRef.current.push(e.data)
        rec.onstop = async () => {
            stream.getTracks().forEach(t => t.stop())
            const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
            setProcessing(true)
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type },
                    body: blob,
                })
                const data = await res.json()
                if (data.text) onTranscript(data.text)
            } finally { setProcessing(false) }
        }
        recRef.current = rec
        rec.start()
        setListening(true)
    }, [getToken, onTranscript])

    const stop = useCallback(() => { recRef.current?.stop(); setListening(false) }, [])

    // Level 1 TTS (free). Later: swap body for an ElevenLabs/OpenAI call.
    const speak = useCallback((text: string, lang = 'es-ES') => {
        if (!('speechSynthesis' in window)) return
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = lang
        u.voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('es')) ?? null
        u.rate = 0.95
        u.onstart = () => setSpeaking(true)
        u.onend = () => setSpeaking(false)
        window.speechSynthesis.speak(u)
    }, [])

    return { listening, processing, speaking, start, stop, speak }
}