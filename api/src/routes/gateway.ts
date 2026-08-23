/**
 * ECLA Gateway Backend — Unpredictable AI Partners (Phase 10).
 *
 * POST /api/v1/gateway/turn
 * Handles the continuous simulation. The AI is given a persona and a
 * secret objective. It must NEVER break character, NEVER say "Correct",
 * and MUST react to meaning over form (Constitution Art. 12/16).
 *
 * Uses Groq (Llama 3 70B/8B) for ultra-low latency conversational turns.
 */
import { Router, Request, Response, NextFunction } from 'express'
import { getOrSyncUserFast } from '../lib/auth'
import { GATEWAY_CONFIGS, type GatewayScenarioId, type GatewayTurn } from '../types/gateway'

const router = Router()

// Ensure GROQ_API_KEY is in your api/.env
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * The core ECLA system prompt for Gateway simulations.
 * Enforces the "no teaching, no correcting" rule.
 */
function buildSystemPrompt(config: typeof GATEWAY_CONFIGS[GatewayScenarioId]): string {
    return `You are participating in a real-world Spanish language simulation. 
You are acting as: ${config.role}.
The setting is: ${config.setting}.
Your secret objective is: ${config.secretObjective}

CRITICAL RULES:
1. NEVER break character. You are a real person in Madrid.
2. NEVER say "Correct", "Incorrect", "Good job", or give language feedback.
3. Speak ONLY in Spanish. Keep responses short (1-2 sentences max).
4. If the learner's Spanish is flawed but the MEANING is clear, respond naturally to the meaning.
5. If you genuinely cannot understand them, react naturally: say "¿Perdón?", "¿Cómo?", or "No entiendo".
6. Do not help them unless they explicitly ask for help (e.g., "¿Cómo se dice...?").
7. Drive the conversation toward your secret objective naturally.`
}

router.post('/api/v1/gateway/turn', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getOrSyncUserFast(req) // Auth check
        
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is missing. Add it to api/.env for Gateway simulations.')
        }

        const { scenarioId, history, learnerText } = req.body as {
            scenarioId: GatewayScenarioId
            history: GatewayTurn[]
            learnerText?: string
        }

        const config = GATEWAY_CONFIGS[scenarioId]
        if (!config) {
            return res.status(400).json({ error: 'Invalid scenario ID' })
        }

        // Build the message array for Groq
        const messages: any[] = [
            { role: 'system', content: buildSystemPrompt(config) }
        ]

        // Add the opening line if this is the very first turn
        if (history.length === 0) {
            messages.push({ role: 'assistant', content: config.openingLine })
            return res.json({ text: config.openingLine, role: 'ai' })
        }

        // Map the existing history
        for (const turn of history) {
            if (turn.role === 'ai') {
                messages.push({ role: 'assistant', content: turn.text })
            } else if (turn.role === 'learner') {
                messages.push({ role: 'user', content: turn.text })
            }
        }

        // Add the current learner input
        if (learnerText) {
            messages.push({ role: 'user', content: learnerText })
        }

        // Call Groq for the AI's response
        const groqRes = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192', // Fast, highly capable, great at Spanish
                messages,
                temperature: 0.7,
                max_tokens: 150,
                top_p: 0.9,
            }),
        })

        if (!groqRes.ok) {
            const errText = await groqRes.text()
            console.error('Groq API error:', errText)
            throw new Error('Failed to generate AI response')
        }

        const data = await groqRes.json()
        const aiText = data.choices?.[0]?.message?.content?.trim() || '...'

        res.json({ text: aiText, role: 'ai' })

    } catch (error) {
        next(error)
    }
})

export default router