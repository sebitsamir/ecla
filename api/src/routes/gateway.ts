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
import { prisma } from '../lib/prisma'
import { scoreGatewayGraduation } from '../lib/gatewayScoring'
import { applyGatewayEvidence } from '../lib/evidenceService'
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

        const { scenarioId, history, learnerText } = req.body as {
            scenarioId: GatewayScenarioId
            history: GatewayTurn[]
            learnerText?: string
        }

        const config = GATEWAY_CONFIGS[scenarioId]
        if (!config) {
            return res.status(400).json({ error: 'Invalid scenario ID' })
        }

        // Opening turn — no AI needed
        if (history.length === 0) {
            return res.json({ text: config.openingLine, role: 'ai' })
        }

        // Graceful fallback when Groq is unavailable (dev / missing key)
        if (!GROQ_API_KEY) {
            const fallbacks = [
                'Entiendo. ¿Algo más?',
                'Vale, perfecto.',
                '¿Perdón? ¿Puedes repetir?',
                'Claro, sin problema.',
            ]
            const text = learnerText?.trim()
                ? fallbacks[Math.floor(Math.random() * fallbacks.length)]
                : config.openingLine
            return res.json({ text, role: 'ai' })
        }
        // Build the message array for Groq
        const messages: any[] = [
            { role: 'system', content: buildSystemPrompt(config) }
        ]

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

/**
 * POST /api/v1/gateway/complete — Phase 16 multi-dimensional graduation.
 */
router.post('/api/v1/gateway/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getOrSyncUserFast(req)
        const { evidence } = (req.body ?? {}) as {
            evidence?: Array<{ scenario: string; transcript?: GatewayTurn[]; communicated?: boolean; repaired?: boolean }>
        }

        const items = Array.isArray(evidence) ? evidence : []
        const graduation = scoreGatewayGraduation(items)

        const gatewayUnit = await prisma.course.findFirst({
            where: { isPublished: true },
            include: {
                units: {
                    where: { title: { contains: 'Gateway', mode: 'insensitive' } },
                    include: { competencies: true },
                },
            },
        })
        const gatewayComps = gatewayUnit?.units?.[0]?.competencies ?? []
        const scorePct = Math.round((graduation.communicated / Math.max(graduation.total, 1)) * 100)
        const comprehension = graduation.dimensions.comprehension === 'Strong' ? 80 : 60
        const production = graduation.dimensions.production === 'Strong' ? 80 : 60

        for (const comp of gatewayComps) {
            await applyGatewayEvidence({
                userId: user.id,
                competencyId: comp.id,
                comprehension,
                production,
                transfer: scorePct,
                interaction: scorePct,
                gatewayContextKey: `gateway:${comp.code}`,
            })
        }

        res.json({ ok: true, graduation })
    } catch (error) {
        next(error)
    }
})

export default router