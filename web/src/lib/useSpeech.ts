'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
    const v = window.speechSynthesis.getVoices()
    if (v.length) cachedVoices = v
    return cachedVoices
}

export function useSpeech(defaultLang = 'es-ES') {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
    const [speaking, setSpeaking] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        if (!supported) return
        loadVoices()
        const onChange = () => loadVoices()
        window.speechSynthesis.addEventListener('voiceschanged', onChange)
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', onChange)
            window.speechSynthesis.cancel()
        }
    }, [supported])

    const stop = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
        if (supported) window.speechSynthesis.cancel()
        setSpeaking(false)
    }, [supported])

    const speak = useCallback((text: string, opts?: { audioUrl?: string | null; lang?: string }) => {
        if (!text) return
        stop()
        const lang = opts?.lang ?? defaultLang

        // Studio audio wins when it exists (future upgrade path)
        if (opts?.audioUrl) {
            const audio = new Audio(opts.audioUrl)
            audioRef.current = audio
            setSpeaking(true)
            audio.onended = () => setSpeaking(false)
            audio.onerror = () => setSpeaking(false)
            audio.play().catch(() => setSpeaking(false))
            return
        }

        if (!supported) return
        const u = new SpeechSynthesisUtterance(text)
        u.lang = lang
        u.rate = 0.92   // slightly slower = learner-friendly
        u.pitch = 1
        const prefix = lang.split('-')[0]
        const voice =
            cachedVoices.find(v => v.lang === lang) ??
            cachedVoices.find(v => v.lang.startsWith(prefix))
        if (voice) u.voice = voice
        u.onstart = () => setSpeaking(true)
        u.onend = () => setSpeaking(false)
        u.onerror = () => setSpeaking(false)
        window.speechSynthesis.speak(u)
    }, [defaultLang, stop, supported])

    return { speak, stop, speaking, supported }
}