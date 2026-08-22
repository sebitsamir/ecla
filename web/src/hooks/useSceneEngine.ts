'use client'

/**
 * useSceneEngine — the state machine that plays a SceneSpec.
 *
 * Responsibilities:
 * - Advances through beats with human pacing (no slot-machine speed).
 * - Auto-beats: `action` (narrator), `say` (NPC speaks + TTS), `transfer-intro`.
 * - Learner-gated beats: `listen` (tap to hear), `choice`, `speak` (mic-first).
 * - Consequences (Phase 9 seeds live here): success → NPC replies naturally;
 *   failure → repair ("¿Perdón?"), hint ladder, and after MAX_ATTEMPTS the
 *   conversation continues anyway — the world never dead-ends (Art. 11/18).
 * - Form vs function: meaning success with imperfect form gets a quiet coach
 *   line, never a wrong (Art. 16).
 * - Emits stage changes so the Journey rail stays in sync.
 *
 * Pure frontend: consumes seeded/scene JSON only; evidence counts are handed
 * to the caller on completion (ScenePlayer posts them to /lessons/complete).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CharacterId, SceneOption, SceneSpec, StageName } from '@/lib/sceneTypes'
import { useTTS } from './useTTS'
import { useMic, type MicError, type MicState } from './useMic'
import { useGrader } from './useGrader'

/** One rendered line in the scene log. */
export type SceneLine = {
    id: number
    /** 'narrator' = stage direction · 'coach' = quiet refinement · else a character bubble */
    who: 'narrator' | 'coach' | CharacterId
    text: string
    /** Learner's own utterance → right-aligned bubble. */
    mine?: boolean
    /** NPC line the learner must tap to hear (listen beat). */
    tap?: string
}

type Support = 'maximum' | 'high' | 'medium' | 'low' | 'minimal'

const REPAIR_LINES = ['¿Perdón?', '¿Cómo?']   // natural human repair triggers
const MAX_ATTEMPTS = 3                        // then the conversation moves on
const PACE_MS = 500                           // breathing room between beats
const ACTION_MS = 1300                        // narrator lines linger
const TTS_BACKSTOP_MS = 4000                  // advance even if TTS never ends

export function useSceneEngine({ scene, support = 'medium', getToken, onStage }: {
    scene: SceneSpec
    support?: Support
    getToken: () => Promise<string | null>
    onStage?: (stage: StageName) => void
}) {
    const [idx, setIdx] = useState(0)
    const [lines, setLines] = useState<SceneLine[]>([])
    const [setting, setSetting] = useState(scene.setting)
    const [finished, setFinished] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [hintLevel, setHintLevel] = useState(0)

    const idRef = useRef(0)
    const npcRef = useRef<CharacterId>('sofia')          // last NPC seen (replies come from them)
    const listenConsumedRef = useRef(false)              // a listen beat advances once
    const counts = useRef({ correct: 0, incorrect: 0 })  // evidence for /lessons/complete

    const { say, stop } = useTTS()
    const grade = useGrader(getToken)

    // Hints are visible only while support is still scaffolded (Art. 12).
    const showHints = support === 'maximum' || support === 'high' || support === 'medium'

    const beat = scene.beats[idx] as SceneSpec['beats'][number] | undefined
    const stage: StageName | undefined = beat?.stage

    /** Append a line, deduping immediate repeats (Strict-Mode safe). */
    const push = useCallback((line: Omit<SceneLine, 'id'>) => {
        setLines(prev => {
            const last = prev[prev.length - 1]
            if (last && last.who === line.who && last.text === line.text) return prev
            return [...prev, { ...line, id: ++idRef.current } as SceneLine]
        })
    }, [])

    const advance = useCallback(() => setIdx(i => i + 1), [])

    // Keep the latest speech handler readable from the stable mic callback.
    const speechRef = useRef<(text: string) => void>(() => {})

    const mic = useMic(getToken, text => speechRef.current(text))

    /** Mic-first resolution: meaning first, form quietly second. */
    const handleSpeech = async (text: string) => {
        const b = scene.beats[idx]
        if (!b || b.kind !== 'speak') return
        push({ who: 'you', text, mine: true })

        const res = await grade(text, { expected: b.expected, accept: b.accept, open: b.open })

        if (res.ok) {
            counts.current.correct++
            // Function succeeded; refine form only when it wasn't a clean match.
            if (res.method === 'fuzzy' || res.method === 'variant' || res.method === 'ai') {
                push({ who: 'coach', text: `They understood you. A natural form: “${b.expected[0]}.”` })
            }
            setAttempts(0)
            setHintLevel(0)
            if (b.replyOnSuccess) {
                push({ who: npcRef.current, text: b.replyOnSuccess })
                say(b.replyOnSuccess, () => setTimeout(advance, PACE_MS))
            } else {
                advance()
            }
            return
        }

        // Failure = data, not punishment. The person reacts; the scene survives.
        counts.current.incorrect++
        const n = attempts + 1
        setAttempts(n)

        if (n < MAX_ATTEMPTS) {
            const repair = REPAIR_LINES[Math.min(n - 1, REPAIR_LINES.length - 1)]
            push({ who: npcRef.current, text: repair })
            say(repair)
            if (showHints && b.hints?.length) setHintLevel(Math.min(n, b.hints.length))
        } else {
            // Third miss: model the target, then the conversation continues anyway.
            push({ who: 'coach', text: `No problem. You can say: “${b.expected[0]}.”` })
            setAttempts(0)
            setHintLevel(0)
            if (b.replyOnSuccess) {
                push({ who: npcRef.current, text: b.replyOnSuccess })
                say(b.replyOnSuccess, () => setTimeout(advance, PACE_MS))
            } else {
                advance()
            }
        }
    }
    speechRef.current = handleSpeech

    /** Choice resolution: correct advances; wrong invites another look. */
    const pick = useCallback((option: SceneOption) => {
        const b = scene.beats[idx]
        if (!b || b.kind !== 'choice') return
        push({ who: 'you', text: option.label, mine: true })
        if (option.correct) {
            counts.current.correct++
            if (b.coach) push({ who: 'coach', text: b.coach })
            setTimeout(advance, PACE_MS + 100)
        } else {
            counts.current.incorrect++
            push({ who: 'coach', text: 'Not quite. Think about the situation — try again.' })
        }
    }, [idx, scene, push, advance])

    /** Tap-to-listen: plays audio; consumes the beat exactly once. */
    const listenTap = useCallback((text: string) => {
        const consume = scene.beats[idx]?.kind === 'listen' && !listenConsumedRef.current
        if (consume) listenConsumedRef.current = true
        say(text, () => { if (consume) setTimeout(advance, PACE_MS) })
    }, [idx, scene, say, advance])

    const submitTyped = useCallback((text: string) => {
        const t = text.trim()
        if (t) speechRef.current(t)   // typed fallback flows through the same grading path
    }, [])

    // ── Beat scheduler: auto-beats play themselves; learner beats wait. ──
    useEffect(() => {
        if (finished) return
        const b = scene.beats[idx]
        if (!b) { setFinished(true); return }
        if (b.stage) onStage?.(b.stage)
        listenConsumedRef.current = false

        let t: ReturnType<typeof setTimeout> | null = null

        if (b.kind === 'action') {
            push({ who: 'narrator', text: b.text })
            t = setTimeout(advance, ACTION_MS)
        } else if (b.kind === 'transfer-intro') {
            push({ who: 'narrator', text: b.text })
            if (b.setting) setSetting(b.setting)   // "Same ability. New situation."
            t = setTimeout(advance, ACTION_MS + 300)
        } else if (b.kind === 'say') {
            npcRef.current = b.character
            push({ who: b.character, text: b.es })
            say(b.es, () => { if (t) clearTimeout(t); t = setTimeout(advance, PACE_MS) })
            // Backstop: never strand the learner if TTS can't finish.
            t = setTimeout(advance, TTS_BACKSTOP_MS + b.es.length * 120)
        } else if (b.kind === 'listen') {
            npcRef.current = b.character
            push({ who: b.character, text: b.es, tap: b.es })
        }
        // 'choice' and 'speak' render in the InteractionDock and wait.

        return () => { if (t) clearTimeout(t); stop() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx, finished, scene])

    return {
        // state
        lines, beat, stage, setting, environment: scene.environment, finished,
        attempts, hintLevel,
        micState: mic.state as MicState, micError: mic.error as MicError,
        counts,
        // actions
        pick, listenTap, submitTyped,
        startMic: mic.start, stopMic: mic.stop,
    }
}

export type SceneEngine = ReturnType<typeof useSceneEngine>