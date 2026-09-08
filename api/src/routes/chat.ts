import { Router, Request, Response, NextFunction } from 'express'
import { groq } from '../lib/groq'
import { getOrSyncUserFast } from '../lib/auth'
import { AppError } from '../lib/errors'
import { chatSchema } from '../lib/schemas'
import { buildLearnerChatContext, formatChatSystemPrompt } from '../lib/learnerContext'
import { aiDailyBudget, aiRateLimit } from '../lib/rateLimit'
import { providerOptions } from '../lib/aiPolicy'
import { errorMessage, log } from '../lib/observability'

const router = Router()

async function callGroqWithRetry(params: any, maxRetries = 1): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const completion = await groq.chat.completions.create(params, providerOptions())
            const reply = completion.choices[0]?.message?.content
            if (reply) return reply
            log('warn', 'chat_provider_empty', { attempt: attempt + 1 })
        } catch (error: unknown) {
            log('warn', 'chat_provider_failed', { attempt: attempt + 1, error: errorMessage(error) })
        }
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
    return null
}

router.post('/api/v1/chat', aiRateLimit, aiDailyBudget, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isVoice = req.body?.voice === true
        const wantsStream = isVoice && req.body?.stream === true

        const parsed = chatSchema.safeParse(req.body)
        if (!parsed.success) {
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

            for (let attempt = 0; attempt <= 1; attempt++) {
                let chunks = 0
                try {
                    const stream = await groq.chat.completions.create({
                        model: 'openai/gpt-oss-20b',
                        messages,
                        temperature: 0.8,
                        max_tokens: 250,             
                        reasoning_effort: 'low', 
                        stream: true,
                    } as any, providerOptions())

                    let finish = ''
                    for await (const chunk of stream as any) {
                        const choice = chunk.choices?.[0]
                        if (choice?.finish_reason) finish = choice.finish_reason
                        const delta = choice?.delta?.content
                        if (delta) { chunks++; res.write(`data: ${JSON.stringify({ delta })}\n\n`) }
                    }

                    log('info', 'chat_stream_completed', { attempt: attempt + 1, chunks, finish })
                    if (chunks > 0) { res.write('data: [DONE]\n\n'); return res.end() }
                    log('warn', 'chat_stream_empty', { attempt: attempt + 1, finish })
                } catch (error: unknown) {
                    log('warn', 'chat_stream_failed', { attempt: attempt + 1, error: errorMessage(error) })
                    if (chunks > 0) {
                        res.write(`data: ${JSON.stringify({ error: 'The tutor connection ended early.' })}\n\n`)
                        res.write('data: [DONE]\n\n')
                        return res.end()
                    }
                }
                if (attempt < 1) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
            }

            res.write(`data: ${JSON.stringify({ error: 'The tutor is temporarily unavailable.' })}\n\n`)
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

        if (!reply) throw new AppError('The tutor is temporarily unavailable', 503)
        res.json({ reply })
    } catch (error) {
        next(error)
    }
})

export default router
