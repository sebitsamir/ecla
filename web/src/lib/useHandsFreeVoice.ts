'use client'

import { useRef, useState, useCallback } from 'react'
import { isSpeechActive } from './speech'

export type VoiceState = 'off' | 'waiting' | 'hearing' | 'processing'

const SR_IMPL: any = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null

export const voiceSupported = typeof SR_IMPL === 'function'

// Close the session ourselves 800ms after the last final result
const FINALIZE_MS = 800

export function useHandsFreeVoice(onUtterance: (text: string) => void) {
    const [state, setState] = useState<VoiceState>('off')
    const [liveText, setLiveText] = useState('')

    const stateRef = useRef<VoiceState>('off')
    const recRef = useRef<any>(null)
    const finalRef = useRef('')
    const interimRef = useRef('')
    const turnRef = useRef(false)
    const endedRef = useRef(true)
    const finalizeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cbRef = useRef(onUtterance)
    cbRef.current = onUtterance

    const setSt = (s: VoiceState) => { stateRef.current = s; setState(s) }

    function clearFinalize() {
        if (finalizeRef.current) { clearTimeout(finalizeRef.current); finalizeRef.current = null }
    }

    function emit(text: string) {
        turnRef.current = false
        setLiveText('')
        setSt('processing')
        cbRef.current(text)
    }

    function killRec() {
        clearFinalize()
        const rec = recRef.current
        recRef.current = null
        if (rec) {
            rec.onresult = null
            rec.onend = null
            rec.onerror = null
            try { rec.abort() } catch { /* already stopped */ }
        }
    }

    function startRec() {
        killRec()
        finalRef.current = ''
        interimRef.current = ''
        const rec = new SR_IMPL()
        rec.lang = 'es-ES'
        rec.continuous = true
        rec.interimResults = true
        rec.maxAlternatives = 1

        // ── THE FIX ── e.results is CUMULATIVE on every platform, and Android
        // Chrome doesn't advance resultIndex reliably. Appending per event
        // caused the staircase repetition ("que que planes…"). Rebuilding the
        // whole transcript from scratch each event is duplication-proof.
        rec.onresult = (e: any) => {
            let final = ''
            let interim = ''
            for (let i = 0; i < e.results.length; i++) {
                const r = e.results[i]
                if (r.isFinal) final += `${r[0].transcript} `
                else interim += r[0].transcript
            }
            const finalsChanged = final !== finalRef.current
            finalRef.current = final
            interimRef.current = interim

            const live = (final + interim).trim()
            setLiveText(live)
            if (live && stateRef.current === 'waiting') setSt('hearing')

            // Smart endpointing: user paused after a final → close session now
            if (finalsChanged) {
                clearFinalize()
                finalizeRef.current = setTimeout(() => {
                    const r = recRef.current
                    if (r && !endedRef.current && stateRef.current !== 'processing') {
                        try { r.stop() } catch { /* noop */ }
                    }
                }, FINALIZE_MS)
            }
        }

        rec.onend = () => {
            clearFinalize()
            if (recRef.current !== rec) return // stale session
            const text = (finalRef.current + interimRef.current).trim()
            if (text) { emit(text); return }
            if (turnRef.current && !endedRef.current) {
                finalRef.current = ''
                interimRef.current = ''
                try { rec.start() } catch { setSt('waiting') } // silence gap — keep listening
            } else {
                setSt('off')
            }
        }

        rec.onerror = (e: any) => {
            console.warn('[Voice] recognition:', e.error)
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                turnRef.current = false
                setSt('off')
            }
        }

        recRef.current = rec
        try { rec.start() } catch { setSt('waiting') }
    }

    const startCall = useCallback(async () => {
        if (!voiceSupported) throw new Error('unsupported')
        endedRef.current = false
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true })
        probe.getTracks().forEach(t => t.stop())
    }, [])

    const listen = useCallback(() => {
        if (endedRef.current || !voiceSupported) return
        if (isSpeechActive()) { setTimeout(() => listen(), 250); return } // never listen over Ecla
        turnRef.current = true
        setLiveText('')
        setSt('waiting')
        startRec()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const endCall = useCallback(() => {
        endedRef.current = true
        turnRef.current = false
        killRec()
        setLiveText('')
        setSt('off')
    }, [])

    return { state, liveText, startCall, listen, endCall }
}