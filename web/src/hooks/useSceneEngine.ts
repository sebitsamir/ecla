'use client'

/**
 * useSceneEngine — the scene runtime (Phases 8 + S2 + S3 + A + Phase 3 Evidence + Phase 5).
 *
 * Behaviors:
 * - Repair phrases from the learner ("¿Puedes repetir?") are ALWAYS a win —
 *   the NPC complies and the learner gets repair evidence (I3).
 * - First failure opens the RepairDock: retry / repeat / example (agency).
 * - First-try clean success can splice a `challenge` beat (branching).
 * - `unexpected` beats: responding OR repairing both count (Art. 15).
 * - Phase A: `captureName` speak beats store the learner's name in memory.
 * - Phase 3: dimensional evidence (comprehension, retrieval, production,
 *   interaction, transfer) + supportUsed + repairUsed.
 * - Phase 5: listen beats are consumed by `listenTap` (hear → advance),
 *   with a scheduler backstop so the learner is never stranded.
 *
 * Implementation notes:
 * - The scheduler reads beats through a ref and depends only on [idx, finished],
 *   so splicing mid-beat never re-triggers the effect (which would cancel TTS).
 * - Empty say/listen beats (missing curriculum payload) advance instantly.
 * - `feedback` drives the rail flashes + SFX (Phase 2/5).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CharacterId, SceneBeat, SceneOption, SceneSpec, StageName } from '@/lib/sceneTypes'
import { useTTS } from './useTTS'
import { useMic, type MicError, type MicState } from './useMic'
import { useGrader } from './useGrader'
import type { RepairAction } from '@/components/ecla/RepairDock'
import { parseLearnerName, rememberLearnerName, recordCharacterEncounter } from '@/lib/memory'

export type SceneLine = {
    id: number
    who: 'narrator' | 'coach' | CharacterId
    text: string
    mine?: boolean
    tap?: string
    gloss?: string
}

type Support = 'maximum' | 'high' | 'medium' | 'low' | 'minimal'

const NPC_REPAIR_LINES = ['¿Perdón?', '¿Cómo?']
const MAX_ATTEMPTS = 3
const PACE_MS = 500
const ACTION_MS = 1300
const TTS_BACKSTOP_MS = 4000

/** Repair = survival skill. Any of these counts as successful communication. */
const REPAIR_RE = /(no entiendo|puedes repetir|repite|m[áa]s despacio|c[óo]mo se dice|qu[ée] significa|otra vez)/i
export const isRepairPhrase = (t: string) => REPAIR_RE.test(t)

/** Phase 3: Map scene stages to evidence dimensions. */
const STAGE_TO_DIM: Record<string, 'comprehension' | 'retrieval' | 'production' | 'interaction' | 'transfer'> = {
    UNDERSTAND: 'comprehension',
    NOTICE: 'comprehension',
    RECOGNIZE: 'comprehension',
    RETRIEVE: 'retrieval',
    PRODUCE: 'production',
    INTERACT: 'interaction',
    TRANSFER: 'transfer',
}

type EvidenceTracker = {
    comprehension: { correct: number; total: number }
    retrieval: { correct: number; total: number }
    production: { correct: number; total: number }
    interaction: { correct: number; total: number }
    transfer: { correct: number; total: number }
    supportUsed: number
    repairUsed: boolean
}

const initialEvidence = (): EvidenceTracker => ({
    comprehension: { correct: 0, total: 0 },
    retrieval: { correct: 0, total: 0 },
    production: { correct: 0, total: 0 },
    interaction: { correct: 0, total: 0 },
    transfer: { correct: 0, total: 0 },
    supportUsed: 0,
    repairUsed: false,
})

export function useSceneEngine({ scene, support = 'medium', getToken, onStage }: {
    scene: SceneSpec
    support?: Support
    getToken: () => Promise<string | null>
    onStage?: (stage: StageName) => void
}) {
    const [beats, setBeats] = useState<SceneBeat[]>(scene.beats)
    const [idx, setIdx] = useState(0)
    const [lines, setLines] = useState<SceneLine[]>([])
    const [setting, setSetting] = useState(scene.setting)
    const [finished, setFinished] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [hintLevel, setHintLevel] = useState(0)
    const [repairOpen, setRepairOpen] = useState(false)
    // Phase 2: brief flash state for the rail + SFX.
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

    const idRef = useRef(0)
    const npcRef = useRef<CharacterId>('sofia')
    const listenConsumedRef = useRef(false)
    const challengedRef = useRef(false)
    const pendingNpcRef = useRef<CharacterId | null>(null)
    const counts = useRef({ correct: 0, incorrect: 0 })
    // Phase 3: Dimensional evidence tracker
    const evidence = useRef<EvidenceTracker>(initialEvidence())

    // Refs mirror state so the scheduler sees fresh data without re-running.
    const beatsRef = useRef(beats)
    beatsRef.current = beats
    const linesRef = useRef(lines)
    linesRef.current = lines

    const { say, stop } = useTTS()
    const grade = useGrader(getToken)

    /** Hints/examples only while support is still scaffolded (Art. 12). */
    const showHints = support === 'maximum' || support === 'high' || support === 'medium'

    const beat = beats[idx] as SceneBeat | undefined
    const stage: StageName | undefined = beat?.stage

    // Reset when a different scene is mounted.
    useEffect(() => {
        setBeats(scene.beats); setIdx(0); setLines([]); setSetting(scene.setting)
        setFinished(false); setAttempts(0); setHintLevel(0); setRepairOpen(false); setFeedback(null)
        pendingNpcRef.current = null
        counts.current = { correct: 0, incorrect: 0 }
        evidence.current = initialEvidence() // Phase 3 reset
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene.id])

    /** Brief green/amber flash (Phase 2). */
    const flash = useCallback((kind: 'correct' | 'incorrect') => {
        setFeedback(kind)
        setTimeout(() => setFeedback(null), 800)
    }, [])

    /** Append a line, deduping immediate repeats (Strict-Mode safe). */
    const push = useCallback((line: Omit<SceneLine, 'id'>) => {
        setLines(prev => {
            const last = prev[prev.length - 1]
            if (last && last.who === line.who && last.text === line.text) return prev
            return [...prev, { ...line, id: ++idRef.current } as SceneLine]
        })
    }, [])

    const advance = useCallback(() => setIdx(i => i + 1), [])
    const speechRef = useRef<(text: string) => void>(() => { })
    const mic = useMic(getToken, text => speechRef.current(text))

    /** Phase 3: Record an attempt for a specific dimension based on the beat's stage. */
    const recordAttempt = (stageName: string | undefined, success: boolean) => {
        if (!stageName) return
        const dim = STAGE_TO_DIM[stageName]
        if (!dim) return
        evidence.current[dim].total += 1
        if (success) evidence.current[dim].correct += 1
    }

    /** The NPC line the learner is currently answering (for repeats). */
    const currentNpcLine = (b: SceneBeat | undefined): string | undefined => {
        if (!b) return undefined
        if (b.kind === 'speak') return b.npcLine
        if (b.kind === 'unexpected') return b.es
        return undefined
    }

    const handleSpeech = async (text: string) => {
        const b = beatsRef.current[idx]
        if (!b || (b.kind !== 'speak' && b.kind !== 'unexpected')) return
        push({ who: 'you', text, mine: true })

        // 1) Repair phrases always win — the NPC complies naturally.
        if (isRepairPhrase(text)) {
            counts.current.correct++
            recordAttempt(b.stage, true)
            evidence.current.repairUsed = true
            flash('correct')
            setRepairOpen(false); setAttempts(0); setHintLevel(0)
            const line = currentNpcLine(b) ?? 'Más despacio, claro.'
            push({ who: npcRef.current, text: line })
            push({ who: 'coach', text: 'Repair successful — interaction maintained' })
            say(line, () => setTimeout(advance, PACE_MS + 400))
            return
        }

        // 2) Grade meaning (unexpected beats are open by definition).
        const expected = b.kind === 'unexpected' ? (b.accept?.length ? b.accept : [b.es]) : b.expected
        const res = await grade(text, {
            expected,
            accept: b.accept,
            open: b.kind === 'unexpected' || (b.kind === 'speak' && b.open === true),
        })

        if (res.ok) {
            counts.current.correct++
            recordAttempt(b.stage, true) // Phase 3: success
            flash('correct')

            // Phase A: capture the learner's name when they give it.
            if (b.kind === 'speak' && b.captureName) {
                const name = parseLearnerName(text)
                if (name) {
                    rememberLearnerName(name)
                    recordCharacterEncounter(getToken, npcRef.current, name)
                    push({ who: npcRef.current, text: `¡Encantada, ${name}!` })
                }
            }

            const clean = res.method === 'exact' || res.method === 'normalized'
            if (!clean) push({ who: 'coach', text: 'Meaning achieved' })
            if (b.kind === 'unexpected') {
                push({ who: 'coach', text: 'Handled an unexpected turn' })
            }

            // Branch: first-try clean success → splice the challenge beat.
            if (clean && b.kind === 'speak' && b.challenge && !challengedRef.current) {
                challengedRef.current = true
                const c = b.challenge
                pendingNpcRef.current = c.character   // consumed when the beat activates
                setBeats(prev => {
                    const next = [...prev]
                    next.splice(idx + 1, 0, {
                        kind: 'speak',
                        stage: b.stage,
                        npcLine: c.es,
                        prompt: c.prompt,
                        expected: c.expected,
                        accept: c.accept,
                        hints: c.hints,
                        replyOnSuccess: c.replyOnSuccess,
                    })
                    return next
                })
            }

            setAttempts(0); setHintLevel(0); setRepairOpen(false)
            if (b.kind === 'speak' && b.replyOnSuccess) {
                push({ who: npcRef.current, text: b.replyOnSuccess })
                say(b.replyOnSuccess, () => setTimeout(advance, PACE_MS))
            } else {
                advance()
            }
            return
        }

        // 3) Failure = data. The person reacts; the learner chooses the repair.
        counts.current.incorrect++
        recordAttempt(b.stage, false) // Phase 3: failure
        flash('incorrect')
        const n = attempts + 1
        setAttempts(n)

        if (n < MAX_ATTEMPTS) {
            const repairLine = NPC_REPAIR_LINES[Math.min(n - 1, NPC_REPAIR_LINES.length - 1)]
            push({ who: npcRef.current, text: repairLine })
            say(repairLine)
            setRepairOpen(true)   // learner agency: RepairDock appears
        } else {
            // Model the target through the person in the scene, then continue.
            push({ who: npcRef.current, text: expected[0] })
            say(expected[0])
            setAttempts(0); setHintLevel(0); setRepairOpen(false)
            if (b.kind === 'speak' && b.replyOnSuccess) {
                push({ who: npcRef.current, text: b.replyOnSuccess })
                say(b.replyOnSuccess, () => setTimeout(advance, PACE_MS))
            } else {
                advance()
            }
        }
    }
    speechRef.current = handleSpeech

    /** RepairDock choices. */
    const repairChoice = useCallback((action: RepairAction) => {
        const b = beatsRef.current[idx]
        if (action === 'retry') { setRepairOpen(false); return }

        // Phase 3: Using support counts as supportUsed
        evidence.current.supportUsed += 1

        if (action === 'repeat') {
            const line = currentNpcLine(b) ?? 'Escucha.'
            push({ who: npcRef.current, text: line })
            say(line)                       // they say it again; learner still answers
            setRepairOpen(false)
            return
        }
        // 'example' — model the target (support fading: counts as a hint)
        const ex = b?.kind === 'speak' ? b.expected[0]
            : b?.kind === 'unexpected' ? (b.accept?.[0] ?? b.es) : ''
        push({ who: npcRef.current, text: ex })
        say(ex)
        setHintLevel(h => h + 1)
        setRepairOpen(false)
    }, [idx, push, say])

    /** "I'm not sure" — raise a hint, or open the RepairDock when none remain. */
    const unsure = useCallback(() => {
        const b = beatsRef.current[idx]
        const hints = b?.kind === 'speak' ? (b.hints ?? []) : []

        // Phase 3: Using a hint counts as supportUsed
        evidence.current.supportUsed += 1

        if (hints.length) setHintLevel(h => Math.min(h + 1, hints.length))
        else setRepairOpen(true)
    }, [idx])

    /** Quiet help: replay the last NPC line (no penalty, no noise). */
    const replayLast = useCallback(() => {
        const last = [...linesRef.current].reverse()
            .find(l => l.who !== 'you' && l.who !== 'narrator' && l.who !== 'coach')
        if (last) say(last.text)
    }, [say])

    const pick = useCallback((option: SceneOption) => {
        const b = beatsRef.current[idx]
        if (!b || b.kind !== 'choice') return
        push({ who: 'you', text: option.label, mine: true })
        if (option.correct) {
            counts.current.correct++
            recordAttempt(b.stage, true)
            flash('correct')
            if (b.coach) push({ who: 'narrator', text: b.coach })
            setTimeout(advance, PACE_MS + 100)
        } else {
            counts.current.incorrect++
            recordAttempt(b.stage, false)
            flash('incorrect')
            push({ who: 'narrator', text: 'That didn\u2019t fit the moment — try again.' })
        }
    }, [idx, push, advance, flash])

    /**
     * Phase 5: consume a listen beat.
     * First tap on the current listen beat: plays the audio (once) and
     * advances on estimated duration — immune to TTS onend races.
     * Later taps (or taps on non-listen lines): plain replay, no advance.
     */
    const listenTap = useCallback((text: string) => {
        const consume = beatsRef.current[idx]?.kind === 'listen' && !listenConsumedRef.current
        if (!consume) {
            say(text) // replay only
            return
        }
        listenConsumedRef.current = true
        let done = false
        const go = () => {
            if (done) return
            done = true
            setTimeout(advance, 1200)
        }
        say(text, go)
        // Backstop: if speech synthesis never reports "ended", move on anyway.
        setTimeout(go, TTS_BACKSTOP_MS + text.length * 120)
    }, [idx, say, advance])

    const submitTyped = useCallback((text: string) => {
        const t = text.trim()
        if (t) speechRef.current(t)
    }, [])

    // ── Beat scheduler ──
    // Deps are ONLY [idx, finished]: splicing beats mid-beat must not re-run
    // this effect (its cleanup would cancel TTS and stall the scene).
    useEffect(() => {
        if (finished) return
        const b = beatsRef.current[idx]
        if (!b) { setFinished(true); return }
        if (b.stage) onStage?.(b.stage)
        listenConsumedRef.current = false
        challengedRef.current = false

        // A spliced challenge beat carries its own speaker.
        if (pendingNpcRef.current) {
            npcRef.current = pendingNpcRef.current
            pendingNpcRef.current = null
        }

        let t: ReturnType<typeof setTimeout> | null = null

        if (b.kind === 'action') {
            push({ who: 'narrator', text: b.text })
            t = setTimeout(advance, ACTION_MS)
        } else if (b.kind === 'transfer-intro') {
            push({ who: 'narrator', text: b.text })
            if (b.setting) setSetting(b.setting)
            t = setTimeout(advance, ACTION_MS + 300)
        } else if (b.kind === 'say') {
            npcRef.current = b.character
            if (!b.es?.trim()) {
                t = setTimeout(advance, 50)   // never strand the learner on empty data
            } else {
                push({ who: b.character, text: b.es, gloss: b.gloss ?? b.en })
                say(b.es, () => { if (t) clearTimeout(t); t = setTimeout(advance, PACE_MS) })
                t = setTimeout(advance, TTS_BACKSTOP_MS + b.es.length * 120)
            }
        } else if (b.kind === 'listen') {
            npcRef.current = b.character
            if (b.es?.trim()) {
                push({ who: b.character, text: b.es, tap: b.es, gloss: b.gloss })
                // Phase 5: never strand the learner — if no tap reaches
                // listenTap within 9s, advance anyway.
                t = setTimeout(() => {
                    if (!listenConsumedRef.current) advance()
                }, 9000)
            } else {
                t = setTimeout(advance, 50)
            }
        } else if (b.kind === 'speak') {
            // Present the NPC's question if it wasn't said yet
            // (spliced challenge beats carry their own line).
            const last = linesRef.current[linesRef.current.length - 1]
            if (b.npcLine && last?.text !== b.npcLine) {
                push({ who: npcRef.current, text: b.npcLine })
                say(b.npcLine)
            }
        } else if (b.kind === 'unexpected') {
            npcRef.current = b.character
            if (b.es?.trim()) {
                push({ who: b.character, text: b.es, gloss: b.gloss })
                say(b.es)
            } else {
                t = setTimeout(advance, 50)
            }
        }
        // 'choice' | 'speak' render in the dock and wait.

        return () => { if (t) clearTimeout(t); stop() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx, finished])

    /** Phase 3: Calculate final dimensional evidence for the backend. */
    const getEvidence = useCallback(() => {
        const e = evidence.current
        const calc = (num: number, den: number) => den > 0 ? Math.round((num / den) * 100) : null
        return {
            comprehension: calc(e.comprehension.correct, e.comprehension.total),
            retrieval: calc(e.retrieval.correct, e.retrieval.total),
            production: calc(e.production.correct, e.production.total),
            interaction: calc(e.interaction.correct, e.interaction.total),
            transfer: calc(e.transfer.correct, e.transfer.total),
            supportUsed: e.supportUsed,
            repairUsed: e.repairUsed,
            completed: true,
        }
    }, [])

    return {
        // state
        lines, beat, stage, setting, environment: scene.environment, finished,
        attempts, hintLevel, repairOpen, showHints, feedback,
        micState: mic.state as MicState, micError: mic.error as MicError,
        counts,
        // actions
        pick, listenTap, submitTyped, repairChoice, unsure, replayLast,
        startMic: mic.start, stopMic: mic.stop,
        // Phase 3: Expose evidence getter
        getEvidence,
    }
}

export type SceneEngine = ReturnType<typeof useSceneEngine>