'use client'

/**
 * useGatewayEngine — The continuous simulation state machine (Phase 10).
 * 
 * Manages the unbroken flow of the Pre-A1 Gateway. It silently captures
 * evidence (transcripts) without interrupting the learner with feedback.
 * Scenarios advance automatically after a set number of exchanges, 
 * simulating the natural end of a real-world interaction.
 */
import { useState, useCallback, useRef } from 'react'
import { 
    GATEWAY_SCENARIOS, 
    GATEWAY_CONFIGS, 
    type GatewaySession, 
    type GatewayTurn, 
    type GatewayScenarioId, 
    type GatewayEvidence 
} from '@/lib/gatewayTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const MAX_TURNS_PER_SCENARIO = 4 // Advance to next scenario after 4 learner inputs

export function useGatewayEngine(getToken: () => Promise<string | null>) {
    const [session, setSession] = useState<GatewaySession | null>(null)
    const [history, setHistory] = useState<GatewayTurn[]>([])
    const [isThinking, setIsThinking] = useState(false)
    const turnsRef = useRef(0)

    const fetchAITurn = useCallback(async (
        scenarioId: GatewayScenarioId, 
        currentHistory: GatewayTurn[], 
        learnerText?: string
    ) => {
        setIsThinking(true)
        try {
            const token = await getToken()
            const res = await fetch(`${API_URL}/api/v1/gateway/turn`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ scenarioId, history: currentHistory, learnerText }),
            })
            if (!res.ok) throw new Error('AI failed to respond')
            const data = await res.json()
            return data.text as string
        } catch (e) {
            console.error('Gateway AI error:', e)
            return '...' // Silent fallback; never break the simulation
        } finally {
            setIsThinking(false)
        }
    }, [getToken])

    const start = useCallback(async () => {
        const newSession: GatewaySession = {
            id: Date.now().toString(36),
            status: 'active',
            currentScenarioIndex: 0,
            evidence: [],
        }
        setSession(newSession)
        setHistory([])
        turnsRef.current = 0

        // Fetch the opening line for the very first scenario
        const firstScenarioId = GATEWAY_SCENARIOS[0]
        const openingLine = GATEWAY_CONFIGS[firstScenarioId].openingLine
        setHistory([{ role: 'ai', text: openingLine }])
    }, [])

    const submit = useCallback(async (text: string) => {
        if (!session || isThinking || !text.trim()) return
        const scenarioId = GATEWAY_SCENARIOS[session.currentScenarioIndex]

        // 1. Add learner turn to history
        const learnerTurn: GatewayTurn = { role: 'learner', text: text.trim() }
        const newHistory = [...history, learnerTurn]
        setHistory(newHistory)
        turnsRef.current += 1

        // 2. Fetch AI response
        const aiText = await fetchAITurn(scenarioId, newHistory)
        const aiTurn: GatewayTurn = { role: 'ai', text: aiText }
        const finalHistory = [...newHistory, aiTurn]
        setHistory(finalHistory)

        // 3. Check if scenario is complete (e.g., 4 learner turns)
        if (turnsRef.current >= MAX_TURNS_PER_SCENARIO) {
            // Capture evidence silently
            const evidence: GatewayEvidence = {
                scenario: scenarioId,
                communicated: false, // scored server-side from transcript
                repaired: finalHistory.some(t => t.role === 'learner' && /perdón|repite|repita|despacio|no entiendo/i.test(t.text)),
                transcript: finalHistory,
            }

            setSession(prev => {
                if (!prev) return prev
                const nextIndex = prev.currentScenarioIndex + 1
                
                if (nextIndex >= GATEWAY_SCENARIOS.length) {
                    return { ...prev, evidence: [...prev.evidence, evidence], status: 'graduated' }
                }
                return { ...prev, evidence: [...prev.evidence, evidence], currentScenarioIndex: nextIndex }
            })

            // Reset history for the next scenario and fetch its opening line
            setHistory([])
            turnsRef.current = 0
            
            if (session.currentScenarioIndex + 1 < GATEWAY_SCENARIOS.length) {
                const nextScenarioId = GATEWAY_SCENARIOS[session.currentScenarioIndex + 1]
                const nextOpening = GATEWAY_CONFIGS[nextScenarioId].openingLine
                // Small delay to let the UI breathe before the next person speaks
                setTimeout(() => {
                    setHistory([{ role: 'ai', text: nextOpening }])
                }, 800)
            }
        }
    }, [session, history, isThinking, fetchAITurn])

    return { session, history, isThinking, start, submit }
}