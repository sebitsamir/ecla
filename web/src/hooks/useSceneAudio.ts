'use client'

/**
 * useSceneAudio — Ambient immersion & synthesized SFX (Phase S3.5).
 * 
 * - Ambient: Cross-fades HTML5 audio loops based on environment/stage.
 * - SFX: Synthesizes "ding" (correct), "thud" (incorrect), and "whoosh" 
 *   (stage transition) using the Web Audio API. Zero external assets needed.
 * - Mute state is persisted in localStorage.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Environment, StageName } from '@/lib/sceneTypes'

const AMBIENT_TRACKS: Partial<Record<Environment, string>> = {
    cafe: '/audio/ambient-cafe.mp3',
    street: '/audio/ambient-street.mp3',
    // Add more environments here as you source the audio files
}

export function useSceneAudio(environment: Environment, stage: StageName | undefined, feedback: 'correct' | 'incorrect' | null) {
    const [isMuted, setIsMuted] = useState(false)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const ambientRef = useRef<HTMLAudioElement | null>(null)
    const prevStageRef = useRef<StageName | undefined>(undefined)

    // Load mute preference
    useEffect(() => {
        const saved = localStorage.getItem('ecla-audio-muted')
        setIsMuted(saved === 'true')
    }, [])

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev
            localStorage.setItem('ecla-audio-muted', String(next))
            if (ambientRef.current) ambientRef.current.muted = next
            return next
        })
    }, [])

    // Initialize Audio Context on first user interaction (browser policy)
    const ensureAudioCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume()
        }
        return audioCtxRef.current
    }, [])

    // ── Synthesized SFX (No external files needed) ──
    const playSfx = useCallback((type: 'correct' | 'incorrect' | 'whoosh' | 'complete') => {
        if (isMuted) return
        const ctx = ensureAudioCtx()
        const now = ctx.currentTime

        if (type === 'correct') {
            // Soft, pleasant high ping
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(880, now)
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1)
            gain.gain.setValueAtTime(0.15, now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
            osc.connect(gain).connect(ctx.destination)
            osc.start(now)
            osc.stop(now + 0.3)
        }
        else if (type === 'incorrect') {
            // Soft, low thud
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(220, now)
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.15)
            gain.gain.setValueAtTime(0.15, now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
            osc.connect(gain).connect(ctx.destination)
            osc.start(now)
            osc.stop(now + 0.2)
        }
        else if (type === 'whoosh') {
            // Filtered noise sweep for stage transitions
            const bufferSize = ctx.sampleRate * 0.4
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
            const data = buffer.getChannelData(0)
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

            const noise = ctx.createBufferSource()
            noise.buffer = buffer
            const filter = ctx.createBiquadFilter()
            filter.type = 'bandpass'
            filter.frequency.setValueAtTime(400, now)
            filter.frequency.exponentialRampToValueAtTime(1600, now + 0.2)
            filter.Q.value = 2

            const gain = ctx.createGain()
            gain.gain.setValueAtTime(0.001, now)
            gain.gain.linearRampToValueAtTime(0.08, now + 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

            noise.connect(filter).connect(gain).connect(ctx.destination)
            noise.start(now)
            noise.stop(now + 0.4)
        }
        else if (type === 'complete') {
            // Ascending triad — soft, celebratory, professional
            const osc1 = ctx.createOscillator()
            const osc2 = ctx.createOscillator()
            const osc3 = ctx.createOscillator()
            const gain = ctx.createGain()

            osc1.type = 'sine'; osc2.type = 'sine'; osc3.type = 'sine'
            osc1.frequency.setValueAtTime(523.25, now)   // C5
            osc2.frequency.setValueAtTime(659.25, now + 0.08)  // E5
            osc3.frequency.setValueAtTime(783.99, now + 0.16)  // G5

            gain.gain.setValueAtTime(0.001, now)
            gain.gain.linearRampToValueAtTime(0.12, now + 0.08)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

            osc1.connect(gain); osc2.connect(gain); osc3.connect(gain)
            gain.connect(ctx.destination)
            osc1.start(now); osc2.start(now + 0.08); osc3.start(now + 0.16)
            osc1.stop(now + 0.8); osc2.stop(now + 0.8); osc3.stop(now + 0.8)
        }
    }, [isMuted, ensureAudioCtx])

    // ── Ambient Loop Management ──
    useEffect(() => {
        const trackUrl = AMBIENT_TRACKS[environment]

        if (!trackUrl || isMuted) {
            if (ambientRef.current) {
                ambientRef.current.pause()
                ambientRef.current.src = ''
            }
            return
        }

        if (!ambientRef.current) {
            ambientRef.current = new Audio()
            ambientRef.current.loop = true
            ambientRef.current.volume = 0
        }

        if (ambientRef.current.src !== window.location.origin + trackUrl) {
            ambientRef.current.src = trackUrl
            ambientRef.current.muted = isMuted

            // Attempt to play (requires prior user interaction)
            const playPromise = ambientRef.current.play()
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Fade in
                    let vol = 0
                    const fadeIn = setInterval(() => {
                        if (vol >= 0.15 || isMuted) {
                            clearInterval(fadeIn)
                            return
                        }
                        vol += 0.01
                        if (ambientRef.current) ambientRef.current.volume = vol
                    }, 50)
                }).catch(() => {
                    // Autoplay blocked by browser until first interaction.
                    // We will unlock it on the first mic tap or speaker click.
                })
            }
        }

        return () => {
            // Optional: fade out on unmount
        }
    }, [environment, isMuted])

    // ── Trigger SFX on Engine Events ──
    useEffect(() => {
        if (feedback === 'correct') playSfx('correct')
        else if (feedback === 'incorrect') playSfx('incorrect')
    }, [feedback, playSfx])

    useEffect(() => {
        if (prevStageRef.current && prevStageRef.current !== stage) {
            playSfx('whoosh')
        }
        prevStageRef.current = stage
    }, [stage, playSfx])

    // Achievement sound on scene completion ──
    useEffect(() => {
        if (stage === 'RETAIN') playSfx('complete')
    }, [stage, playSfx])

    // Unlock audio context on first user click (if autoplay was blocked)
    useEffect(() => {
        const unlock = () => {
            ensureAudioCtx()
            if (ambientRef.current && ambientRef.current.paused && !isMuted) {
                ambientRef.current.play().catch(() => { })
            }
            window.removeEventListener('click', unlock)
            window.removeEventListener('touchstart', unlock)
        }
        window.addEventListener('click', unlock)
        window.addEventListener('touchstart', unlock)
        return () => {
            window.removeEventListener('click', unlock)
            window.removeEventListener('touchstart', unlock)
        }
    }, [ensureAudioCtx, isMuted])

    return { isMuted, toggleMute }
}