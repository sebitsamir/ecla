import { Router, Request, Response, NextFunction } from 'express'
import { groq } from '../lib/groq'
import { getOrSyncUserFast } from '../lib/auth'
import { AppError } from '../lib/errors'
import { chatSchema } from '../lib/schemas'
import { buildLearnerChatContext, formatChatSystemPrompt } from '../lib/learnerContext'
import { aiRateLimit } from '../lib/rateLimit'

const router = Router()

console.log('[BOOT] chat routes v6 (curriculum-bound) loaded')

async function callGroqWithRetry(params: any, maxRetries = 2): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const completion = await groq.chat.completions.create(params)
            const reply = completion.choices[0]?.message?.content
            if (reply) return reply
            console.warn(`[CHAT] Attempt ${attempt + 1}: empty response`)
        } catch (error: any) {
            console.error(`[CHAT] Attempt ${attempt + 1} failed:`, error.message)
        }
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
    return null
}

router.post('/api/v1/chat', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isVoice = req.body?.voice === true
        const wantsStream = isVoice && req.body?.stream === true

        const parsed = chatSchema.safeParse(req.body)
        if (!parsed.success) {
            console.error('[CHAT] Validation failed:', JSON.stringify(parsed.error.flatten()))
            throw new AppError('Invalid chat data', 400)
        }

        const user = await getOrSyncUserFast(req)
        const ctx = await buildLearnerChatContext(user.id)

        const systemPrompt = formatChatSystemPrompt(ctx, isVoice)

        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...parsed.data.messages.map(m => ({ role: m.role, content: m.content })),
        ]

        // Streaming path of the voice
        if (wantsStream) {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache, no-transform')
            res.setHeader('Connection', 'keep-alive')
            res.flushHeaders()

            for (let attempt = 0; attempt <= 2; attempt++) {
                try {
                    const stream = await groq.chat.completions.create({
                        model: 'openai/gpt-oss-20b',
                        messages,
                        temperature: 0.8,
                        max_tokens: 250,             
                        reasoning_effort: 'low', 
                        stream: true,
                    } as any)

                    let chunks = 0
                    let finish = ''
                    for await (const chunk of stream as any) {
                        const choice = chunk.choices?.[0]
                        if (choice?.finish_reason) finish = choice.finish_reason
                        const delta = choice?.delta?.content
                        if (delta) { chunks++; res.write(`data: ${JSON.stringify({ delta })}\n\n`) }
                    }

                    console.log(`[CHAT] stream attempt ${attempt + 1}: chunks=${chunks} finish=${finish}`)
                    if (chunks > 0) { res.write('data: [DONE]\n\n'); return res.end() }
                    console.warn(`[CHAT] Stream attempt ${attempt + 1}: empty (finish=${finish})`)
                } catch (e: any) {
                    console.error(`[CHAT] Stream attempt ${attempt + 1} failed:`, e.message)
                }
                if (attempt < 2) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
            }

            res.write(`data: ${JSON.stringify({ delta: 'No te oí bien. ¿Puedes repetir?' })}\n\n`)
            res.write('data: [DONE]\n\n')
            return res.end()
        }

        // Normal text chat
        const reply = await callGroqWithRetry({
            model: 'openai/gpt-oss-20b',
            messages,
            temperature: 0.7,
            max_tokens: 300,
            reasoning_effort: 'low',
        } as any)

        res.json({ reply: reply ?? 'No te oí bien. ¿Puedes repetir?' })
    } catch (error) {
        next(error)
    }
})

export default router